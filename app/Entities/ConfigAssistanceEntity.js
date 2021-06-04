'use strict';

const ConfigAssistance = use('App/Models/ConfigAssistance');
const DB = use('Database');
const DBException = require('../Exceptions/DBException');
const NotFoundException = require('../Exceptions/NotFoundModelException');
const { validation } = require('validator-error-adonis');
const { validateAll } = use('Validator');
const moment = require('moment');
const AssistanceEntity = require('../Entities/AssistanceEntity');

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
            .orderBy('date', 'ASC')
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

    async assistances (authentication, id, entity_id, page = 1, query_search = "") {
        let config_assistance = await ConfigAssistance.query()
            .where('entity_id', entity_id)
            .where('id', id)
            .first();
        if (!config_assistance) throw new NotFoundException("La configuración de asistencia");
        let assistanceEntity = new AssistanceEntity();
        let filters = { config_assistance_id: config_assistance.id };
        let assistances = await assistanceEntity.getAssistances(authentication, page, filters, query_search);
        return { config_assistance, assistances };
    }

    async store (datos = {}) {
        await validation(validateAll, datos, {
            config_schedule_id: 'required',
            date: 'required|dateFormat:YYYY-MM-DD'
        });
        // obtener fecha
        let index = moment(datos.date).day();
        let payload = {
            config_schedule_id: datos.config_schedule_id,
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