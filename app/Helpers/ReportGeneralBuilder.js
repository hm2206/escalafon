'use static';

const View = use('View');
const { default: collect } = require('collect.js');
const htmlToPdf = require('html-pdf-node');
const moment = require('moment');
const Work = use('App/Models/Work');
const xlsx = require('node-xlsx');
const DB = use('Database');

class ReportGeneralBuilder {

    filters = {
        entity_id: "",
        cargo_id: "",
        type_categoria_id: "",
    }

    result = null

    type = "pdf"

    allowType = {
        pdf: {
            handle: this.formatPDF,
            header: 'application/pdf'
        },
        excel: {
            handle: this.formatExcel,
            header: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
    }

    options = {
        format: 'A3',
        landscape: true
    }

    works = []


    constructor(authentication = {}, filters = this.filters, type = 'pdf') {
        this.authentication = authentication;
        this.filters = Object.assign(this.filters, filters);
        this.people = collect([]);
        this.dependencias = collect([]);
        this.type = type;
    }

    async getWorks() {
        let works = Work.query()
            .join('infos as i', 'i.work_id', 'works.id')
            .join('type_categorias as type', 'type.id', 'i.type_categoria_id')
            .join('type_cargos as car', 'car.id', 'i.type_cargo_id')
            .orderBy('works.orden', 'ASC')
            .where('i.estado', 1)
        // filtros
        for(let attr in this.filters) {
            let value = this.filters[attr];
            if (!value) continue;
            works.where(`i.${attr}`, value);
        }
        // obtener
        works.select(
            'works.*', 'i.fecha_de_ingreso', 'i.fecha_de_cese', 
            'i.dependencia_id',
            DB.raw(`type.descripcion as displayCategoria`),
            DB.raw(`car.description as displayCargo`)
        )
        works = await works.fetch();
        this.works = works.toJSON();
    }

    async getPeople(page = 1, ids = []) {
        let datos = await this.authentication.get(`person?page=${page}&ids=${ids.join('&ids=')}&perPage=100`)
        .then(res => {
            let { people } = res.data
            return { ...people, success: true }
        })
        .catch(() => ({ success: false }))
        if (!datos.success) return;
        // guardar datos
        this.people.push(...datos.data);
        // siguiente carga
        let nextPage = page + 1;
        if (datos.lastPage >= nextPage) await this.getPeople(nextPage);
    }

    async getDepedencias(page = 1, ids = []) {
        let datos = await this.authentication.get(`dependencia?page=${page}&ids=${ids.join('&ids=')}&perPage=100`)
        .then(res => {
            let { dependencia } = res.data
            return { ...dependencia, success: true }
        })
        .catch(() => ({ success: false }))
        if (!datos.success) return;
        // guardar datos
        this.dependencias.push(...datos.data);
        // siguiente carga
        let nextPage = page + 1;
        if (datos.lastPage >= nextPage) await this.getDepedencias(nextPage);
    }

    async stepPeople() {
        let idPlucked = collect(this.works).pluck('person_id');
        let idChunk = idPlucked.chunk(100);
        for (let ids of idChunk) {
            await this.getPeople(1, ids.toArray())
        }
    }

    async stepDependencias() {
        let idPlucked = collect(this.works).pluck('dependencia_id');
        let idChunk = idPlucked.chunk(100);
        for (let ids of idChunk) {
            await this.getDepedencias(1, ids.toArray())
        }
    }

    async settingWorks() {
        for(let work of this.works) {
            let person = this.people.where('id', work.person_id).first() || {}
            let dependencia = this.dependencias.where('id', work.dependencia_id).first() || {};

            if (person.id) {
                person.date_of_birth = moment(`${person.date_of_birth}`, 'YYYY-MM-DD').format('DD/MM/YYYY');
            }

            if (work.fecha_de_ingreso) work.fecha_de_ingreso = moment(work.fecha_de_ingreso).format('DD/MM/YYYY');
            if (work.fecha_de_cese) work.fecha_de_cese = moment(work.fecha_de_cese).format('DD/MM/YYYY');

            work.person = person;
            work.dependencia = dependencia;
        }
    }

    dataRender() {
        return {
            works: this.works,
        }
    }

    async formatPDF(that, datos = []) {
        const html = View.render('report/general', datos);
        const file = { content: html }
        return await htmlToPdf.generatePdf(file, that.options);
    }

    async formatExcel(that, datos = {}) {
        let headers = [
            "Doc.", "Numero", "Trabajador", "Sexo", "Estado Civil", "Fecha Nacimiento", 
            "Fecha Inicio Laboral", "Area/Oficina", "Cat/Nivel Rem", "Reg. Labor", 
            "Ubigeo", "Código Cuspp", "Código Es Salud", "Teléfono", "mail", "Dirección"
        ];
        let content = [];
        let works = [...datos.works];
        // mapping
        works.map((w, index) => {
            const departamento = w.person.badge.departamento || "";
            const provincia = w.person.badge.provincia || "";
            const distrito = w.person.badge.distrito || "";
            content.push([
                `${w.person.document_type.name || ''}`.toUpperCase(),
                `${w.person.document_number || ''}`,
                `${w.person.fullname || ''}`.toUpperCase(),
                `${w.person.gender || ''}`.toUpperCase(),
                `${w.person.marital_status || ''}`.toLowerCase(),
                `${w.person.date_of_birth || ''}`,
                `${w.fecha_de_ingreso || ''}`,
                `${w.dependencia.nombre || '--'}`,
                `${w.displayCategoria || ''}`,
                `${w.displayCargo}`.toUpperCase(),
                `${w.person.badge.cod_ubi} - ${departamento} - ${provincia} - ${distrito}`,
                `${w.numero_de_cussp || ""}`,
                `${w.numero_de_essalud || ""}`,
                `${w.person.phone || ''}`,
                `${w.person.email_contact || ''}`,
                `${w.person.address || ''}`
            ]);
            // data
            return w;
        });
        // response
        let data = [headers, ...content];
        let result = await xlsx.build([{ name: 'reporte-general', data }])
        return result;
    }

    async render() {
        // obtener works
        await this.getWorks();
        // obtener people
        await this.stepPeople();
        // obtener dependencias
        await this.stepDependencias();
        // setting works
        await this.settingWorks();
        // render
        const datos = this.dataRender();
        // render type
        let handle = this.allowType[this.type];
        let that = this;
        if (typeof handle.handle != 'function') throw new Error("No se pudó generar el reporte");
        let result = await handle.handle(that, datos);
        return {
            result,
            header: handle.header
        };
    }   

}

module.exports = ReportGeneralBuilder;