'use static';

const htmlToPdf = require('html-pdf-node');
const collect = require('collect.js');
const moment = require('moment');
const View = use('View');
const DB = use('Database');
const Info = use('App/Models/Info');
const uid = require('uid')

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
    day = ""
    infos = []
    people = []
    limit = 53
    count = 0
    page = 1
    options = {
        format: 'A4'
    }

    constructor(authentication, year, month, day, filters = this.filters) {
        this.authentication = authentication;
        this.year = year;
        this.month = month;
        this.day = day;
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
                .where(DB.raw(`YEAR(schedules.date) = ${this.year}`))
                .where(DB.raw(`MONTH(schedules.date) = ${this.month}`))
                .with('assistances', buildA => {
                    buildA.select('assistances.id', 'assistances.schedule_id', 'assistances.clock_id', 'assistances.record_time', 'assistances.status')
                        .where('assistances.state', 1)
                        .orderBy('assistances.record_time', 'ASC')
                })
                .select(...attrs)
                .groupBy(...attrs)
                .orderBy('schedules.date', 'ASC')
                
                if (this.day) build.where(DB.raw('DAY(schedules.date)'), this.day) 
            }) 
            .join('works as w', 'w.id', 'infos.work_id')
            .join('schedules as s', 's.info_id', 'infos.id')
            .join('assistances as a', 'a.schedule_id', 's.id')
            .where(DB.raw(`YEAR(s.date) = ${this.year}`))
            .where(DB.raw(`MONTH(s.date) = ${this.month}`))
            if (this.day) tmpInfos.where(DB.raw('DAY(s.date)'), this.day);
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
            .orderBy('w.orden', 'ASC')
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

    displayTitle() {
        let textMonth = `${moment(`${this.date}`, 'YYYY-MM-DD').format('MMMM')}`;
        return `REPORTE DE MARCACION DE ASISTENCIA | ${textMonth} - ${this.year}`;
    }

    displayJob(info = {}) {
        return {
            fullname: info.person && info.person.fullname || "",
            categoria: info.type_categoria && info.type_categoria.descripcion || ""
        }
    }

    displayFecha(schedule = {}) {
        let currentDate = moment(schedule.date, 'YYYY-MM-DD');
        let fecha = `${currentDate.format('dddd, DD') } de ${currentDate.format('MMMM')} de ${currentDate.year()}`;
        let newAssistances = [];
        // assistance
        for (let assistance of schedule.assistances) {
            newAssistances.push(this.displayAssistance(assistance));
        }
        // response
        return { fecha, assistances: newAssistances };
    }

    displayAssistance(assistance) {
        return { 
            modo: assistance.clock_id ? 'RELOJ' : 'MANUAL',
            time: assistance.record_time || "",
            status: assistance.status == 'ENTRY' ? 'Entrada' : 'Salida'
        }
    }

    schemaData(value = "", key, rows = 1) {
        let type = typeof value;
        let allowKey = ['TITLE', 'JOB', 'CATEGORIA', 'FECHA', 'ASSISTANCE', 'PAGE'];
        if (!allowKey.includes(key)) throw new Error("El tipo es invalido!!!");
        return {
            id: uid(8),
            current: value,
            key,
            type,
            rows,
        }
    }

    async settingData() {
        let newDatos = [];
        newDatos.push(this.schemaData(this.displayTitle(), 'TITLE', 2))
        this.count = 2;
        // infos
        for (let info of this.infos) {
            newDatos.push(this.schemaData(this.displayJob(info), 'JOB', 4));
            this.count += 4;
            // schedules
            for (let schedule of info.schedules) {
                newDatos.push(this.schemaData(this.displayFecha(schedule), 'FECHA'));
                this.count += 1;
            }
            
        }
        // response datos
        return newDatos;
    }

    async dataRender() {
        // datos
        return {
            datos: await this.settingData(),
            moment,
        }
    }

    async render() {
        // date
        this.date = moment(`${this.year}-${this.month}-01`, 'YYYY-MM-DD').format('YYYY-MM-DD');
        // configs
        await this.getAssistances();
        await this.stepPeople();
        await this.settingAssistances();
        // generar HTML
        let datos = await this.dataRender();
        let html = await View.render('report/assistance_monthly', datos);
        // generar PDF
        let file = { content: html };
        return await htmlToPdf.generatePdf(file, this.options);
    }
}

module.exports = ReportAssistanceBuild;