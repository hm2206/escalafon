'use strict';

const moment = require("moment");
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

    async update ({ params, request }) {
        let datos = request.all();
        let configScheduleEntity = new ConfigScheduleEntity();
        let config_schedule = await configScheduleEntity.update(params.id, datos);
        // reponse
        return {
            success: true,
            status: 201,
            message: "Los cambios se guardarón correctamente!",
            config_schedule,
        }
    }

    async config_assistances ({ params, request }) {
        let datos = {};
        let fecha = moment();
        datos.page = request.input('page', 1);
        datos.month = request.input('month', fecha.month() + 1);
        datos.year = request.input('year', fecha.year());
        let configScheduleEntity = new ConfigScheduleEntity();
        let { config_schedule, config_assistances } = await configScheduleEntity.config_assistances(params.id, datos);
        // reponse
        return {
            success: true,
            status: 200,
            config_schedule,
            config_assistances
        }
    }

}

module.exports = ConfigScheduleController
