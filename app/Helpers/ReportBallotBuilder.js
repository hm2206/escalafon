'use static';

const View = use('View');
const { default: collect } = require('collect.js');
const htmlToPdf = require('html-pdf-node');
const moment = require('moment');
const Ballot = use('App/Models/Ballot');
const xlsx = require('node-xlsx');
const DB = use('Database');

const currentDate = moment();

class ReportBallotBuilder {

    filters = {
        day: "",
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

    ballots = []

    constructor(authentication = {}, year, month, filters = this.filters, type = 'pdf') {
        this.authentication = authentication;
        this.filters = Object.assign(this.filters, filters);
        this.people = collect([]);
        this.type = type;
        this.year = year;
        this.month = month;
    }

    async getBallots() {
        let ballots = Ballot.query()
            .orderBy('w.orden', 'ASC')
            .join('schedules as s', 's.id', 'ballots.schedule_id')
            .join('infos as i', 'i.id', 's.info_id')
            .join('works as w', 'w.id', 'i.work_id')
            .where(DB.raw('YEAR(s.`date`)'), this.year)
            .where(DB.raw('MONTH(s.`date`)'), this.month)
        // filters
        for (let attr in this.filters) {
            let value = this.filters[attr];
            if (value && attr == 'day') ballots.where(DB.raw(`DAY(date)`), value);
            else if (value) ballots.where(`i.${attr}`, value);
        } 
        // obtener
        ballots.select('ballots.*', 's.date', 'w.person_id', 'w.orden')
        ballots = await ballots.fetch();
        this.ballots = await ballots.toJSON();
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
        let idPlucked = collect(this.ballots).pluck('person_id');
        let idChunk = idPlucked.chunk(100);
        for (let ids of idChunk) {
            await this.getPeople(1, ids.toArray())
        }
    }

    async settingBallots() {
        this.ballots.map(b => {
            let person = this.people.where('id', b.person_id).first() || {};
            b.person = person;
            b.date = moment(b.date, 'YYYY-MM-DD').format('YYYY/MM/DD');
            b.time_start = b.time_start ? moment(b.time_start, 'HH:mm').format('HH:mm') : '--';
            b.time_over = moment(b.time_over, 'HH:mm').format('HH:mm');
            b.time_return = b.time_return ? moment(b.time_return, 'HH:mm').format('HH:mm') : '--';
        });
    }

    dataRender() {
        return {
            ballots: this.ballots,
        }
    }

    async formatPDF(that, datos = []) {
        const html = View.render('report/ballots', datos);
        const file = { content: html }
        return await htmlToPdf.generatePdf(file, that.options);
    }

    async formatExcel(that, datos = {}) {
        let headers = [
            "N°", "Apellidos y Nombres", "Tipo", "Document",
            "N° Papeleta", "Motivo", "Fecha", "Modo", "H. Entrada",
            "H. Salida", "H. Retorno", "Total Min", "¿Aplica a descuento?",
            "Justificación"
        ];
        let content = [];
        let ballots = [...datos.ballots];
        // mapping
        ballots.map((b, index) => {
            content.push([
                index + 1,
                `${b.person.fullname || ''}`.toUpperCase(),
                `${b.person.document_type.name || ''}`.toUpperCase(),
                `${b.person.document_number || ''}`,
                `${b.ballot_number || ''}`,
                `${b.motivo || ''}`,
                `${b.date || ''}`,
                `${b.modo == 'ENTRY' ? 'Entrada' : 'Salida'}`,
                `${b.time_start || ''}`,
                `${b.time_over || ''}`,
                `${b.time_return || ''}`,
                `${b.total || ''}`,
                `${b.is_applied  ? 'Si' : 'No'}`,
                `${b.justification || ''}`,
            ]);
            // data
            return b;
        });
        // response
        let data = [headers, ...content];
        let result = await xlsx.build([{ name: 'reporte-general', data }])
        return result;
    }

    async render() {
        // obtener ballots
        await this.getBallots();
        // obtener people
        await this.stepPeople();
        // setting works
        await this.settingBallots();
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

module.exports = ReportBallotBuilder;