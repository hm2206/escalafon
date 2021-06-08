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

    async replicar ({ params, request }) {
        let scheduleEntity = new ScheduleEntity();
        let { schedule, schedules } = await scheduleEntity.replicar(params.id);
        return {
            success: true,
            status: 201,
            message: "El horario se replicó correctamente!",
            schedule,
            schedules
        };
    }

}

module.exports = ScheduleController
