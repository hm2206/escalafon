'use strict'

const AssistanceEntity = require('../../Entities/AssistanceEntity');

class AssistanceController {

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
