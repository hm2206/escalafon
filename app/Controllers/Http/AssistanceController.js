'use strict'

const AssistanceEntity = require('../../Entities/AssistanceEntity');
const ConfigAssistance = use('App/Models/ConfigAssistance');

class AssistanceController {

    async index ({ request }) {
        let entity = request.$entity;
        let { page, query_search } = request.all();
        let config_assistance = await ConfigAssistance.query()
            .where('entity_id', entity.id)
            .where('id', request.input('config_assistance'))
        let filtros = { entity_id: entity.id };
        let authentication = request.api_authentication;
        let assistanceEntity = new AssistanceEntity();
        let assistances = await assistanceEntity.getAssistances(authentication, page || 1, filtros, query_search || "");
        // response
        return {
            success: true,
            status: 201,
            assistances
        }
    }

    async store ({ request }) {
        let payload = request.all();
        let assistanceEntity = new AssistanceEntity();
        let assistance = await assistanceEntity.store(payload);
        // response
        return {
            success: true,
            status: 201,
            message: "La asistencia se regístro correctamente!",
            assistance
        }
    }

    async update ({ params, request }) {
        let datos = request.all();
        let assistanceEntity = new AssistanceEntity();
        let assistance = await assistanceEntity.update(params.id, datos);
        return {
            success: true,
            status: 201,
            message: `La asistencia se actualizó correctamente!`,
            assistance
        }
    }

    async delete ({ params, request }) {
        let assistanceEntity = new AssistanceEntity();
        let assistance = await assistanceEntity.delete(params.id);
        return {
            success: true,
            status: 201,
            message: `La asistencia se oculto correctamente!`,
            assistance
        }
    }

}

module.exports = AssistanceController
