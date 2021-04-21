'use strict'

const AssistanceEntity = require('../../Entities/AssistanceEntity');

class AssistanceController {

    async index ({ request }) {
        let entity = request.$entity;
        let { page, query_search } = request.all();
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
        let entity = request.$entity;
        let payload = request.all();
        payload.entity_id = entity.id;
        let assistanceEntity = new AssistanceEntity();
        await assistanceEntity.store(payload);
        // response
        return {
            success: true,
            status: 201,
            message: "La asistencia se regístro correctamente!"
        }
    }

}

module.exports = AssistanceController
