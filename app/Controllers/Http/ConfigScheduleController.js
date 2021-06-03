'use strict';

const ConfigScheduleEntity = require("../../Entities/ConfigScheduleEntity");

class ConfigScheduleController {

    async index ({ request }) {
        let page = request.input('page', 1);
        let configScheduleEntity = new ConfigScheduleEntity();
        let config_schedules = await configScheduleEntity.index({ page });
        // reponse
        return {
            success: true,
            status: 201,
            config_schedules,
        }
    }

    async store ({ request }) {
        let datos = request.all();
        let entity = request.$entity;
        datos.entity_id = entity.id;
        let configScheduleEntity = new ConfigScheduleEntity();
        let config_schedule = await configScheduleEntity.store(datos);
        // reponse
        return {
            success: true,
            status: 201,
            message: "Los datos se guardarón correctamente!",
            config_schedule,
        }
    }

}

module.exports = ConfigScheduleController
