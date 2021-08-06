'use strict';

const ScheduleEntity = require('../../Entities/ScheduleEntity');
const CustomException = require('../../Exceptions/CustomException');
const NotFoundModelException = require('../../Exceptions/NotFoundModelException');
const Schedule = use('App/Models/Schedule')

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

    async isEdit ({ params, request }) {
        let datos = request.all();
        let schedule = await Schedule.query()
            .where('id', params.id) 
            .where('is_blocked', 0)
            .where('status', '<>', 'D')
            .first()
        if (!schedule) throw new NotFoundModelException("El horario")
        let info = await schedule.info().fetch();
        // process
        try {
            let calc = (info.hours * 60);
            let limitDiscount = datos.discount > calc ? calc : datos.discount
            let discount = datos.status == 'F' ? calc : limitDiscount;
            // preparar cambios
            schedule.merge({
                status: datos.status != 'D' ? datos.status : 'D',
                discount,
                observation: datos.observation,
                is_edited: 1
            })
            // guardar cambios
            await schedule.save()
            // response
            return {
                success: true,
                status: 201,
                message: "El horario se actualizó correctamente!",
                schedule,
            };
        } catch (error) {
            throw new CustomException("No se puó guardar los datos")
        }
    }

}

module.exports = ScheduleController
