'use static';

const htmlToPdf = require('html-pdf-node');
const collect = require('collect.js');
const moment = require('moment');
const View = use('View');
const DB = use('Database');
const Info = use('App/Models/Info');

const days = {
    0: "Domingo",
    1: "Lunes",
    2: "Martes",
    3: "Míercoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado"
}

class ReportAssistanceBuild {

    filters = {
        entity_id: "",
        planilla_id: "",
        cargo_id: "",
        type_categoria_id: "",
        id: "",
        query_search: ""
    }
    authentication = {}
    year = ""
    month = ""
    infos = []
    people = []
    options = {
        format: 'A4'
    }

    constructor(authentication, year, month, filters = this.filters) {
        this.authentication = authentication;
        this.year = year;
        this.month = month;
        this.filters = filters;
        this.people = collect([]);
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
        let idPlucked = collect(collect(this.infos).pluck('person_id'));
        let idChunk = idPlucked.chunk(100);
        for (let ids of idChunk) {
            await this.getPeople(1, ids.toArray())
        }
    }

    async getAssistances() {
        let attributes = [
            'infos.id', 'infos.planilla_id', 'infos.cargo_id', 'infos.type_categoria_id', 
            'infos.work_id', 'infos.resolucion', 'infos.pap', 'w.person_id', 'w.orden'
        ];
        // obtener assistances
        let tmpInfos = Info.query()
            .with('planilla')
            .with('cargo')
            .with('type_categoria')
            .with('schedules', build => {   
                let attrs = ['schedules.id', 'schedules.date', 'schedules.index', 'schedules.info_id']
                build.join('assistances as ass', 'ass.schedule_id', 'schedules.id')
                .with('assistances', buildA => {
                    buildA.select('assistances.id', 'assistances.schedule_id', 'assistances.clock_id', 'assistances.record_time', 'assistances.status')
                        .where('assistances.state', 1)
                })
                .select(...attrs)
                .groupBy(...attrs)
            }) 
            .join('works as w', 'w.id', 'infos.work_id')
            .join('schedules as s', 's.info_id', 'infos.id')
            .join('assistances as a', 'a.schedule_id', 's.id')
            .where(DB.raw(`YEAR(s.date) = ${this.year}`))
            .where(DB.raw(`MONTH(s.date) = ${this.month}`))
        // filtros
        for (let attr in this.filters) {
            let value = this.filters[attr];
            let allowRaw = ['entity_id', 'planilla_id', 'cargo_id', 'type_categoria_id', 'id'];
            let allowLike = ['query_search'];
            if (Array.isArray(value)) {
                if (allowRaw.includes(attr)) tmpInfos.whereIn(`infos.${attr}`, value)
            } else if (value != '' && value != null) {
                if (allowRaw.includes(attr)) tmpInfos.where(`infos.${attr}`, value)
                if (allowLike.includes(attr)) tmpInfos.where(`w.orden`, 'like', `%${value}%`)
            }
        }
        // obtener datos
        tmpInfos = await tmpInfos.groupBy(...attributes)
            .select(...attributes)
            .fetch();
        // response
        this.infos = await tmpInfos.toJSON();
    }

    async settingAssistances() {
        await this.infos.map(info => {
            info.person = this.people.where('id', info.person_id).first() || {};
            return info;
        });
    }

    dateRender() {
        // displayers
        let displayMonth = `${moment(new Date(`${this.year}-${this.month}-01`)).format('MMMM')}`;
        // datos
        return {
            year: this.year,
            month: this.year,
            displayMonth,
            infos: this.infos,
            days,
            moment,
        }
    }

    async render() {
        await this.getAssistances();
        await this.stepPeople();
        await this.settingAssistances();
        // generar HTML
        let html = await View.render('report/assistance_monthly', this.dateRender());
        // generar PDF
        let file = { content: html };
        return await htmlToPdf.generatePdf(file, this.options);
    }
}

module.exports = ReportAssistanceBuild;