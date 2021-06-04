'use strict';

const { validateAll } = use('Validator')
const ConfigSchedule = use('App/Models/ConfigSchedule');
const DBException = require('../Exceptions/DBException');
const { validation } = require('validator-error-adonis');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');
const ConfigAssistance = use('App/Models/ConfigAssistance');
const DB = use('Database');

class ConfigScheduleEntity {

    schemaPage = {
        page: 1,
        perPage: 20,
        query_string: "",
        custom: {}
    }

    async index (tmpDatos = this.schemaPage) {
        let datos = Object.assign(this.schemaPage, tmpDatos);
        let config_schedules = ConfigSchedule.query();
        // filtrar
        for (let attr in datos.custom) {
            let value = datos.custom[attr];
            if (Array.isArray(value)) config_schedules.whereIn(attr, value);
            else if (value !== '' && value !== null) config_schedules.where(attr, value); 
        }
        // páginar
        config_schedules = await config_schedules.paginate(datos.page, datos.perPage);
        // response
        return await config_schedules.toJSON();
    }

    async store (datos = {}) {
        await validation(validateAll, datos, {
            name: "required|unique:config_schedules|max:50",
            entity_id: "required"
        });
        // guardar datos
        try {
            return await ConfigSchedule.create({
                name: datos.name,
                entity_id: datos.entity_id,
            });
        } catch (error) {
            throw new DBException(error, 'regístro');
        }
    }

    async update (id, datos = {}) {
        await validation(validateAll, datos, {
            name: "required|max:50"
        });
        // obtener config schedule
        let config_schedule = await ConfigSchedule.find(id);
        if (!config_schedule) throw new NotFoundModelException("La configuración de horario");
        // actualizar datos
        try {
            config_schedule.merge({ name: datos.name });
            await config_schedule.save();
            return config_schedule;
        } catch (error) {
            throw new DBException(error, 'regístro');
        }
    }

    async config_assistances (id, tmpDatos = this.schemaPage) {
        let datos = Object.assign({}, tmpDatos);
        let config_schedule = await ConfigSchedule.query()
            .where('id', id)
            .first();
        if (!config_schedule) throw new NotFoundException("La configuración de horario");
        let config_assistances = ConfigAssistance.query()
            .where("config_schedule_id", config_schedule.id)
        // filtrar por fecha
        if (datos.year) config_assistances.where(DB.raw('YEAR(date)'), datos.year);
        if (datos.month) config_assistances.where(DB.raw('MONTH(date)'), datos.month);
        // filtrar
        for (let attr in datos.custom) {
            let value = datos.custom[attr];
            if (Array.isArray(value)) config_assistances.whereIn(attr, value);
            else if (attr =! '' && attr != null) config_assistances.where(attr, value);
        }
        // páginar
        config_assistances = await config_assistances.paginate(datos.page, datos.perPage);
        // response
        return { config_schedule, config_assistances };
    }

}

module.exports = ConfigScheduleEntity;