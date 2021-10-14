'use static';

const View = use('View');
const { default: collect } = require('collect.js');
const htmlToPdf = require('html-pdf-node');
const moment = require('moment');
const Info = use('App/Models/Info');
const DB = use('Database');
const xlsx = require('node-xlsx');

class ReportInfoBuilder {

    filters = {
        entity_id: "",
        cargo_id: "",
        type_categoria_id: "",
        year: "",
        month: "",
        estado: 1
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
        format: 'A4',
        landscape: true
    }

    infos = []


    constructor(authentication = {}, filters = this.filters, type = 'pdf') {
        this.authentication = authentication;
        this.filters = Object.assign(this.filters, filters);
        this.people = collect([]);
        this.type = type;
    }

    async getInfos() {
        let infos = Info.query()
            .join('works as w', 'infos.work_id', 'w.id')
            .join('type_categorias as cat', 'cat.id', 'infos.type_categoria_id')
            .join('planillas as pla', 'pla.id', 'infos.planilla_id')
            .orderBy('w.orden', 'ASC')
        // filtros
        for(let attr in this.filters) {
            let value = this.filters[attr];
            if (!value) continue;
            if (attr == 'year') {
                infos.whereRaw(`YEAR(infos.fecha_de_cese) = ${value}`);
            } else if(attr == 'month') {
                infos.whereRaw(`MONTH(infos.fecha_de_cese) = ${value}`);
            } else {
                infos.where(`infos.${attr}`, value);
            }
        }
        // obtener
        infos.select(
            'infos.*', 
            'w.person_id', 
            'infos.fecha_de_cese',
            DB.raw(`cat.descripcion as displayCategoria`),
            DB.raw(`pla.nombre as displayPlanilla`)
        )
        infos = await infos.fetch();
        this.infos = infos.toJSON();
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
        await this.people.push(...datos.data);
        // siguiente carga
        let nextPage = page + 1;
        if (datos.lastPage >= nextPage) await this.getPeople(nextPage);
    }

    async stepPeople() {
        let idPlucked = collect(this.infos).pluck('person_id');
        let idChunk = idPlucked.chunk(100);
        for (let ids of idChunk) {
            await this.getPeople(1, ids.toArray())
        }
    }

    async settingWorks() {
        for(let info of this.infos) {
            let person = await this.people.where('id', info.person_id).first() || {}
            info.fecha_de_cese = moment(info.fecha_de_cese, 'YYYY-MM-DD').format('DD/MM/YYYY');
            info.person = person;
        }
    }

    dataRender() {
        return {
            infos: this.infos,
        }
    }

    async formatPDF(that, datos = []) {
        const html = View.render('report/infos', datos);
        const file = { content: html }
        return await htmlToPdf.generatePdf(file, that.options);
    }

    async formatExcel(that, datos = {}) {
        let headers = ["N°", "Apellidos y Nombres", "Tipo", "Document", "Sexo", "Fecha de Nacimiento", "Edad", "Correo", "Teléfono", "Dirección"];
        let content = [];
        let infos = [...datos.infos];
        // mapping
        infos.map((i, index) => {
            content.push([
                index + 1,
                `${i.person.fullname || ''}`.toUpperCase(),
                `${i.person.document_type.name || ''}`.toUpperCase(),
                `${i.person.document_number || ''}`,
                `${i.person.gender || ''}`,
                `${i.person.date_of_birth || ''}`,
                `${i.person.edad || ''}`,
                `${i.person.email_contact || ''}`,
                `${i.person.phone || ''}`,
                `${i.person.address || ''}`
            ]);
            // data
            return i;
        });
        // response
        let data = [headers, ...content];
        let result = await xlsx.build([{ name: 'reporte-contraro', data }])
        return result;
    }

    async render() {
        // obtener works
        await this.getInfos();
        // obtener people
        await this.stepPeople();
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

module.exports = ReportInfoBuilder;