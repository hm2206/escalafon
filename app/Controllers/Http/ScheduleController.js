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

    async update ({ params, request }) {
        let entity = request.$entity;
        let datos = request.all();
        let scheduleEntity = new ScheduleEntity();
        let schedule = await scheduleEntity.update(params.id, datos, { 'i.entity_id': entity.id });
        return {
            success: true,
            status: 201,
            message: "El horario se actualizó correctamente!",
            schedule,
        };
    }

    async delete ({ params, request }) {
        let entity = request.$entity;
        let scheduleEntity = new ScheduleEntity();
        let schedule = await scheduleEntity.delete(params.id, { 'i.entity_id': entity.id });
        return {
            success: true,
            status: 201,
            message: "El horario se eliminó correctamente!",
            schedule,
        };
    }

    async replicar ({ params, request }) {
        let entity = request.$entity;
        let scheduleEntity = new ScheduleEntity();
        let { schedule, schedules } = await scheduleEntity.replicar(params.id, { 'i.entity_id': entity.id });
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
