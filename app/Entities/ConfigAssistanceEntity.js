'use strict';

const ConfigAssistance = use('App/Models/ConfigAssistance');
const DB = use('Database');
const DBException = require('../Exceptions/DBException');
const NotFoundException = require('../Exceptions/NotFoundModelException');
const { validation } = require('validator-error-adonis');
const { validateAll } = use('Validator');
const moment = require('moment');

class ConfigAssistanceEntity {

    async index (filtros = { entity_id: "", year: "", month: "" }) {
        await validation(null, filtros, {
            entity_id: "required",
            year: "required|integer",
            month: "required|integer"
        });
        // obtener
        let config_assistance = await ConfigAssistance.query()
            .where('entity_id', filtros.entity_id)
            .where(DB.raw('YEAR(date)'), filtros.year)
            .where(DB.raw('MONTH(date)'), filtros.month)
            .fetch();
        config_assistance = await config_assistance.toJSON();
        // preparar datos
        let datos = {
            page: 1,
            lastPage: 1,
            total: config_assistance.length,
            data: config_assistance
        }
        // response
        return datos;
    }

    async store (datos = {}) {
        await validation(validateAll, datos, {
            entity_id: 'required',
            date: 'required|dateFormat:YYYY-MM-DD'
        });
        // obtener fecha
        let index = moment(datos.date).day();
        let payload = {
            entity_id: datos.entity_id,
            index,
            date: datos.date
        }
        // guardar datos
        try {
            return await ConfigAssistance.create(payload);
        } catch (error) {
            throw new DBException(error);
        }
    }

    async delete (id, entity_id) {
        let config_assistance = await ConfigAssistance.query()
            .where('entity_id', entity_id)
            .where('id', id)
            .first();
        if (!config_assistance) throw new NotFoundModelException("La Configuración de asistencia");
        await config_assistance.delete();
        return config_assistance;
    }

}

module.exports = ConfigAssistanceEntity;