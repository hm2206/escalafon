'use strict';

const Work = use('App/Models/Work');
const View = use('View');
const htmlToPdf = require('html-pdf-node');
const { default: collect } = require('collect.js');
const moment = require('moment');
const xlsx = require('node-xlsx');
const DB = use('Database');
const { format } = require('currency-formatter');

const currentDate = moment();

class ReportVacationBasicBuilder {

    authentication = null;
    entity = null;
    work_id = "";
    works = []

    filters = {
        work_id: "",
        cargo_id: "",
        type_categoria_id: "",
        year: currentDate.year()
    }

    type = 'pdf' 

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

    people = [];
    works = [];
    config_vacations = [];

    options = {
        format: 'A4'
    }

    constructor(authentication, entity, filters = this.filters, type = 'pdf') {
        this.authentication = authentication;
        this.entity = entity;
        this.people = collect([]);
        this.filters = filters;
        this.type = type;
    }

    async getWorks() {
        // dias ejecutados
        const  { sql: diasEjecutados } = await DB.table('vacations as vac')
            .where('vac.config_vacation_id', DB.raw('c.id'))
            .select(DB.raw('IFNULL(SUM(vac.days_used), 0)'))
            .toSQL();
        // obtener datos
        let works = Work.query()
            .join('infos as i', 'i.work_id', 'works.id')
            .join('config_vacations as c', 'c.work_id', 'works.id')
            .join('type_categorias as type', 'type.id', 'i.type_categoria_id')
            .join('planillas as pla', 'pla.id', 'i.planilla_id')
            .where('pla.principal', 1)
            .where('i.entity_id', this.entity.id)
            .where('c.entity_id', this.entity.id)
            .where('i.estado', 1)
            .select(
                'works.id', 'type.descripcion as displayCategoria', 'i.pap', 
                'works.person_id', 'c.scheduled_days', 'c.year',
                DB.raw(`(${diasEjecutados}) as days_used`),
                DB.raw(`c.scheduled_days - (${diasEjecutados}) as days_diff`)
            )
            .groupBy(
                'works.id', 'type.descripcion', 'works.person_id', 'i.pap', 
                'c.id', 'c.year', 'c.scheduled_days'
            )
            .orderBy('works.orden', 'ASC')
            .orderBy('c.year', 'ASC')
        // filtros
        for(let attr in this.filters) {
            let value = this.filters[attr];
            if (!value) continue;
            if (Array.isArray(value) && !value.length) continue;
            works.where(`i.${attr}`, value);
        }
        // obtener trabajadores
        works = await works.fetch();
        this.works = await works.toJSON();
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
        let idPlucked = collect(this.works).pluck('person_id');
        let idChunk = idPlucked.chunk(100);
        for (let ids of idChunk) {
            await this.getPeople(1, ids.toArray())
        }
    }

    async settingWorks() {
        const max = `${this.works.length}`.length;
        const prefix = '0000000000'.substring(0, max);
        await this.works.map((work, index) => {
            const countIter = `${index + 1}`.length;
            const count = `${prefix.substring(countIter, max)}${index + 1}`;
            work.person = this.people.where('id', work.person_id).first() || {};
            work.count = count;
            return work;
        });
    }

    async dataRender() {
        // datos
        return {
            entity: this.entity,
            datos: this.works
        }
    }

    async formatPDF(that, datos = []) {
        const html = View.render('report/vacation_basics', datos);
        const file = { content: html }
        return await htmlToPdf.generatePdf(file, that.options);
    }

    async formatExcel(that, datos = {}) {
        let content = [];
        let collection = [...datos.datos];
        // header
        content.push(["N°", "Apellidos y Nombres", "Tip. Categoría", "Situación", "Año", "Dias Prog.", "Dias Ejecutados.", "Saldo"]);
        // mapping
        collection.forEach((c) => {
            content.push([
                c.count,
                `${c.person.fullname}`.toUpperCase(),
                c.displayCategoria,
                c.pap,
                c.year,
                c.scheduled_days,
                c.days_used,
                c.days_diff
            ])
        });
        // response
        let data = [...content];
        let result = await xlsx.build([{ name: 'reporte-vacacion-basics', data }])
        return result;
    }

    async render() {
        await this.getWorks();
        await this.stepPeople();
        await this.settingWorks();
        // generar HTML
        // render
        const datos = await this.dataRender();
        // render type
        let handle = this.allowType[this.type];
        let that = this;
        if (typeof handle.handle != 'function') throw new Error("No se pudó generar el reporte");
        let result = await handle.handle(that, datos);
        // response
        return {
            result,
            header: handle.header
        };
    }

}

module.exports = ReportVacationBasicBuilder;