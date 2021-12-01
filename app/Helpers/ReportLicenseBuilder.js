'use static';

const View = use('View');
const { default: collect } = require('collect.js');
const htmlToPdf = require('html-pdf-node');
const moment = require('moment');
const License = use('App/Models/License');
const xlsx = require('node-xlsx');
const DB = use('Database');

const currentDate = moment();

class ReportLicenseBuilder {

    filters = {
        entity_id: "",
        cargo_id: "",
        type_categoria_id: "",
    }

    result = null

    type = "pdf"

    year = currentDate.year();
    month = currentDate.month() + 1;

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

    licenses = []

    constructor(authentication = {}, year, month, filters = this.filters, type = 'pdf') {
        this.authentication = authentication;
        this.filters = Object.assign(this.filters, filters);
        this.people = collect([]);
        this.type = type;
        this.year = year;
        this.month = month;
    }

    async getLicenses() {
        let licenses = License.query()
            .orderBy('licenses.date_over', 'DESC')
            .join('situacion_laborals as s', 's.id', 'licenses.situacion_laboral_id')
            .join('infos as i', 'i.id', 'licenses.info_id')
            .join('works as w', 'w.id', 'i.work_id')
            .where(DB.raw(`(YEAR(licenses.date_start) = ${this.year} AND MONTH(licenses.date_start) = ${this.month})`))
            .where(DB.raw(`(YEAR(licenses.date_over) = ${this.year} AND MONTH(licenses.date_over) = ${this.month})`))
        // filters
        for (let attr in this.filters) {
            let value = this.filters[attr];
            if (value) licenses.where(`i.${attr}`, value);
        } 
        // obtener
        licenses.select('licenses.*', 's.nombre as situacion_laboral', 'w.person_id', 'w.orden')
        licenses = await licenses.fetch();
        this.licenses = await licenses.toJSON();
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
        let idPlucked = collect(this.licenses).pluck('person_id');
        let idChunk = idPlucked.chunk(100);
        for (let ids of idChunk) {
            await this.getPeople(1, ids.toArray())
        }
    }

    async settingLicenses() {
        this.licenses.map(l => {
            let person = this.people.where('id', l.person_id).first() || {};
            l.person = person;
            l.date_resolution = moment(l.date_resolution, 'YYYY-MM-DD').format('DD/MM/YYYY');
            l.date_start = moment(l.date_start, 'YYYY-MM-DD').format('DD/MM/YYYY');
            l.date_over = moment(l.date_over, 'YYYY-MM-DD').format('DD/MM/YYYY');
        });
    }

    dataRender() {
        return {
            licenses: this.licenses,
        }
    }

    async formatPDF(that, datos = []) {
        const html = View.render('report/licenses', datos);
        const file = { content: html }
        return await htmlToPdf.generatePdf(file, that.options);
    }

    async formatExcel(that, datos = {}) {
        let headers = [
            "N°", "Apellidos y Nombres", "Tipo", "Document",
            "L/P", "Resolución", "F.Resolución", "F.Inicio", "F.Termino",
            "Días Usados", "¿Con goce?", "Descripción"
        ];
        let content = [];
        let licenses = [...datos.licenses];
        // mapping
        licenses.map((s, index) => {
            content.push([
                index + 1,
                `${s.person.fullname || ''}`.toUpperCase(),
                `${s.person.document_type.name || ''}`.toUpperCase(),
                `${s.person.document_number || ''}`,
                `${s.situacion_laboral || ''}`,
                `${s.resolution || ''}`,
                `${s.date_resolution || ''}`,
                `${s.date_start || ''}`,
                `${s.date_over || ''}`,
                `${s.days_used || ''}`,
                `${s.is_pay ? 'Si' : 'No'}`,
                `${s.description || ''}`
            ]);
            // data
            return s;
        });
        // response
        let data = [headers, ...content];
        let result = await xlsx.build([{ name: 'reporte-licencias-permisos', data }])
        return result;
    }

    async render() {
        // obtener ballots
        await this.getLicenses();
        // obtener people
        await this.stepPeople();
        // setting works
        await this.settingLicenses();
        // render
        const datos = this.dataRender();
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

module.exports = ReportLicenseBuilder;