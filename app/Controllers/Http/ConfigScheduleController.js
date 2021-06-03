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

}

module.exports = ConfigScheduleController
