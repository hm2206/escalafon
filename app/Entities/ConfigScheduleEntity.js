'use strict';

const { collect } = require("collect.js");
const ConfigSchedule = use('App/Models/ConfigSchedule');

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

}

module.exports = ConfigScheduleEntity;