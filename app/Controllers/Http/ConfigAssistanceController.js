'use strict'

const moment = require('moment');
const ConfigAssistanceEntity = require('../../Entities/ConfigAssistanceEntity');

class ConfigAssistanceController {

    async index ({ request }) {
        let current_date = moment();
        let entity = request.$entity;
        let year = request.input('year', current_date.year());
        let month = request.input('month', current_date.month() + 1);
        let payload = {};
        payload.entity_id = entity.id;
        payload.year = year;
        payload.month = month;
        let configAssistanceEntity = new ConfigAssistanceEntity();
        let config_assistances = await configAssistanceEntity.index(payload);
        // render
        return {
            success: true,
            status: 201,
            config_assistances,
        }
    }

    async assistances ({ params, request }) {
        let { page, query_search } = request.all();
        let entity = request.$entity;
        let authentication = request.api_authentication;
        let configAssistanceEntity = new ConfigAssistanceEntity();
        let config_assistance = await configAssistanceEntity.assistances(authentication, params.id, entity.id, page || 1, query_search || "");
        // response
        return {
            success: true,
            status: 201,
            ...config_assistance
        }
    }

    async store ({ request }) {
        let entity = request.$entity;
        let configAssistanceEntity = new ConfigAssistanceEntity();
        let datos = request.all();
        datos.entity_id = entity.id;
        let config_assistance = await configAssistanceEntity.store(datos);
        // render
        return { 
            success: true,
            status: 201,
            message: "La configuración se guardó correctamente!",
            config_assistance
        }
    }

    async delete ({ params, request }) {
        let entity = request.$entity;
        let configAssistanceEntity = new ConfigAssistanceEntity();
        let config_assistance = await configAssistanceEntity.delete(params.id, entity.id);
        // response
        return {
            success: true,
            status: 201,
            message: "la configuración se eliminó correctamente!",
            config_assistance
        }
    }

}

module.exports = ConfigAssistanceController
