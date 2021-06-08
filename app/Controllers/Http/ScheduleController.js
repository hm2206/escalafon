'use strict';

const ScheduleEntity = require('../../Entities/ScheduleEntity');

class ScheduleController {

    async store ({ request }) {
        let scheduleEntity = new ScheduleEntity();
        let datos = request.all();
        let schedule = await scheduleEntity.store(datos);
        return {
            success: true,
            status: 201,
            message: "El horario se creó correctamente!",
            schedule
        };
    }

}

module.exports = ScheduleController
