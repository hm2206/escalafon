'use strict';

const Assistance = use('App/Models/Assistance');
const DBException = require('../Exceptions/DBException');
const { validation } = require('validator-error-adonis');
const { validateAll } = use('Validator');
const collect = require('collect.js');

class AssistanceEntity {

    datosDefault = {
        entity_id: "",
        work_id: "",
        record_time: "",
        status: "ENTRY"
    }

    status = {
        ENTRY: "EXIT",
        EXIT: "ENTRY",
    }

    async getAssistances (authentication, page = 1, filtros = {}, query_search = "") {
        let assistances = Assistance.query()
            .join('works as w', 'w.id', 'assistances.work_id')
            .select('assistances.*', 'w.person_id', 'w.orden');
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
            entity_id: "required",
            work_id: "required",
            record_time: "required|date" 
        });
        // preparar datos
        let payload = {
            entity_id: datos.entity_id,
            work_id: datos.work_id,
            record_time: datos.record_time,
            status: datos.status,
        };
        // obtener ultimo registro
        let assistance_old = await Assistance.query()
            .where('entity_id', datos.entity_id)
            .where('work_id', datos.work_id)
            .orderBy('id', 'DESC')
            .first();
        if (assistance_old) {
            let is_status = this.status[assistance_old.status];
            if (is_status) payload.status = is_status;
        }
        // guardar datos
        try {
            return await Assistance.create(payload);
        } catch (error) {
            throw new DBException(error, "registro");
        }
    }

}

module.exports = AssistanceEntity;