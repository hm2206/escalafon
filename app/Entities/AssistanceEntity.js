'use strict';

const Assistance = use('App/Models/Assistance');
const ReportAssistanceBuild = require('../Helpers/ReportAssistanceBuilder');
const DBException = require('../Exceptions/DBException');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');
const { validation, ValidatorError } = require('validator-error-adonis');
const { validateAll } = use('Validator');
const collect = require('collect.js');
const moment = require('moment');

class AssistanceEntity {

    datosDefault = {
        schedule_id: "",
        clock_id: "",
        record_time: "",
        status: "ENTRY"
    }

    status = {
        ENTRY: "EXIT",
        EXIT: "ENTRY",
    }

    constructor (authentication = null) {
        if (authentication) this.authentication = authentication;
    }

    async getAssistances (authentication, page = 1, filtros = {}, query_search = "") {
        let assistances = Assistance.query()
            .with('schedule')
            .join('schedules as s', 's.id', 'assistances.schedule_id')
            .join('infos as i', 'i.id', 's.info_id')
            .join('works as w', 'w.id', 'i.work_id')
            .select('assistances.*', 'w.person_id', 'w.orden')
            .where('assistances.state', 1)
            .orderBy('w.orden', 'ASC')
            .orderBy('record_time', 'ASC');
        // filtros
        for (let attr in filtros) {
           let value = filtros[attr];
           if (value) assistances.where(attr, value);
        }
        // query
        if (query_search) assistances.where('w.orden', 'like', `%${query_search}%`);
        // paginar
        assistances = await assistances.paginate(page, 20);
        assistances = await assistances.toJSON();
        // obtener person
        let pluckId = collect(assistances.data).pluck('person_id').toArray();
        let ids = `ids=${pluckId.join('&ids=')}`;
        let { people } = await authentication.get(`person?page=1&${ids}`)
        .then(res => res.data)
        .catch(err => ({ success: false, people: [] }));
        people = collect(people.data || []);
        // setting
        await assistances.data.map(a => {
            a.person = people.where('id', a.person_id).first() || {};
            return a;
        });
        // response
        return assistances;
    }

    async store (datos = this.datosDefault) {
        await validation(validateAll, datos, {
            schedule_id: "required",
            record_time: "required" 
        });
        // preparar datos
        let record_time = moment(datos.record_time, 'HH:mm').format('HH:mm:ss');
        let payload = {
            schedule_id: datos.schedule_id,
            record_time,
            status: this.datosDefault.status,
        };
        // obtener ultimo registro
        let assistance_old = await Assistance.query()
            .where('schedule_id', datos.schedule_id)
            .orderBy('record_time', 'DESC')
            .first();
        if (assistance_old) {
            let is_status = this.status[assistance_old.status];
            if (is_status) payload.status = is_status;
            // validar hora
            if (record_time <= assistance_old.record_time) throw new ValidatorError([{ field: 'record_time', message: `El tiempo debe ser mayor de ${assistance_old.record_time}` }])
        }
        // guardar datos
        try {
            return await Assistance.create(payload);
        } catch (error) {
            throw new DBException(error, "registro");
        }
    }

    async update (id, datos = this.datosDefault) {
        let assistance = await Assistance.find(id);
        if (!assistance) throw new NotFoundModelException('La asistencia');
        assistance.merge({ status: datos.status });
        await assistance.save();
        return assistance;
    }

    async delete (id) {
        let assistance = await Assistance.find(id);
        if (!assistance) throw new NotFoundModelException('La asistencia');
        assistance.merge({ state: 0 });
        await assistance.save();
        return assistance;
    }

    async reportMonthly(year, month, filters = {}) {
        let integerMonth = parseInt(month)
        const reportAssistanceBuild = new ReportAssistanceBuild(this.authentication, year, integerMonth, filters);
        return await reportAssistanceBuild.render();
    }

}

module.exports = AssistanceEntity;