'use strict';

const Assistance = use('App/Models/Assistance');
const DBException = require('../Exceptions/DBException');
const { validation } = require('validator-error-adonis');
const { validateAll } = use('Validator');

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

    // async getClocks (page = 1) {
    //     let clocks = Clock.query();
    //     // paginar
    //     return await clocks.paginate(page, 20);
    // }

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