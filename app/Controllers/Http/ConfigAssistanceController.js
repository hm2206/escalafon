'use strict'

const ConfigAssistanceEntity = require('../../Entities/ConfigAssistanceEntity');

class ConfigAssistanceController {

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

}

module.exports = ConfigAssistanceController
