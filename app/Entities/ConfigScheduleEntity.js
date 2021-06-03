'use strict';

const { validateAll } = use('Validator')
const ConfigSchedule = use('App/Models/ConfigSchedule');
const DBException = require('../Exceptions/DBException');
const { validation } = require('validator-error-adonis');

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
            name: "required|unique:clocks",
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

}

module.exports = ConfigScheduleEntity;