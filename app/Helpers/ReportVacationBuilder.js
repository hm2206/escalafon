'use strict';

const Work = use('App/Models/Work');
const ConfigVacation = use('App/Models/ConfigVacation');
const uid = require('uid')
const View = use('View');
const htmlToPdf = require('html-pdf-node');
const { default: collect } = require('collect.js');
const moment = require('moment');

class ReportVacationBuilder {

    authentication = null;
    entity = null;
    work_id = "";

    filters = {
        work_id: "",
        cargo_id: "",
        type_categoria_id: ""
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
        let works = Work.query()
            .join('infos as i', 'i.work_id', 'works.id')
            .join('config_vacations as c', 'c.work_id', 'works.id')
            .select('works.id', 'works.person_id')
            .groupBy('works.id', 'works.person_id')
            .where('i.entity_id', this.entity.id)
            .where('c.entity_id', this.entity.id)
            .orderBy('works.orden', 'ASC')
        // filtros
        for(let attr in this.filters) {
            let value = this.filters[attr];
            if (!value) continue;
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

    async getConfigVacations() {
        let config_vacations = ConfigVacation.query()
            .join('works as w', 'w.id', 'config_vacations.work_id')
            .join('infos as i', 'i.work_id', 'w.id')
            .with('vacations', (build) => build.orderBy('date_start', 'ASC')
                .select(
                    'id', 'config_vacation_id', 'resolucion', 
                    'date_start', 'date_over', 'days_used', 'observation'
                ))
            .where('config_vacations.entity_id', this.entity.id)
            .where('i.entity_id', this.entity.id)
            .orderBy('year', 'ASC')
            .groupBy(
                'config_vacations.id', 'config_vacations.work_id', 'config_vacations.year', 'config_vacations.scheduled_days', 
                'config_vacations.date_start', 'config_vacations.date_over'
            )
            .select(
                'config_vacations.id', 'config_vacations.work_id', 'config_vacations.year', 'config_vacations.scheduled_days', 
                'config_vacations.date_start', 'config_vacations.date_over'
            );
        // filtros
        for(let attr in this.filters) {
            let value = this.filters[attr];
            if (!value) continue;
            config_vacations.where(`i.${attr}`, value);
        }
        // obtener config_vacations
        config_vacations = await config_vacations.fetch();
        this.config_vacations = await config_vacations.toJSON();
    }

    async settingWorks() {
        let config_vacations = collect(this.config_vacations);
        await this.works.map(work => {
            work.person = this.people.where('id', work.person_id).first() || {};
            work.config_vacations = config_vacations.where('work_id', work.id).toArray() || [];
            return work;
        });
    }

    schemaData(value = "", key, rows = 1) {
        let type = typeof value;
        let allowKey = ['WORK', 'VACATION'];
        if (!allowKey.includes(key)) throw new Error("El tipo es invalido!!!");
        return {
            id: uid(8),
            current: value,
            key,
            type,
            rows,
        }
    }

    displayWork(work = {}) {
        return {
            fullname: work.person && work.person.fullname || "",
            document_type:  work.person && work.person.document_type && work.person.document_type.name || "",
            document_number: work.person && work.person.document_number || ""
        }
    }

    displayConfigVacation(config_vacation = {}) {
        let newVacations = [];
        let vacations = collect(config_vacation.vacations || []);
        let executed_days = vacations.sum('days_used');
        let balance = config_vacation.scheduled_days - executed_days;
        // assistance
        for (let vacation of vacations) {
            newVacations.push(this.displayVacation(vacation));
        }

        delete config_vacation.vacations;
        // response
        return { 
            ...config_vacation,
            executed_days,
            balance,
            vacations: newVacations 
        };
    }

    displayVacation(vacation) {
        vacation.date_start = moment(vacation.date_start).format('DD/MM/YYYY');
        vacation.date_over = moment(vacation.date_over).format('DD/MM/YYYY');
        return vacation
    }

    async settingData() {
        let newDatos = [];
        // works
        for (let work of this.works) {
            newDatos.push(this.schemaData(this.displayWork(work), 'WORK', 2));
            this.count += 2;
            // config vacations
            for (let config_vacation of work.config_vacations) {
                newDatos.push(this.schemaData(this.displayConfigVacation(config_vacation), 'VACATION'));
                this.count += 1;
            }
        }
        // response datos
        return newDatos;
    }

    async dataRender() {
        // datos
        return {
            entity: this.entity,
            datos: await this.settingData(),
        }
    }

    async render() {
        await this.getWorks();
        await this.stepPeople();
        await this.getConfigVacations();
        await this.settingWorks();
        // generar HTML
        let datos = await this.dataRender();
        let html = await View.render('report/vacations', datos);
        // generar PDF
        let file = { content: html };
        return await htmlToPdf.generatePdf(file, this.options);
    }

}

module.exports = ReportVacationBuilder;