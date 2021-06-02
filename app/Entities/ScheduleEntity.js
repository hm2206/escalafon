'use strict';

const { collect } = require("collect.js");
const Schedule = use('App/Models/Schedule');

class ScheduleEntity {

    schemaPage = {
        page: 1,
        perPage: 20,
        query_string: "",
        custom: {}
    }

    async index (tmpDatos = this.schemaPage) {
        let datos = Object.assign(this.schemaPage, tmpDatos);
        let schedules = Schedule.query();
        // filtrar
        for (let attr in datos.custom) {
            let value = datos.custom[attr];
            if (Array.isArray(value)) schedules.whereIn(attr, value);
            else if (value !== '' && value !== null) schedules.where(attr, value); 
        }
        // páginar
        schedules = await schedules.paginate(datos.page, datos.perPage);
        // response
        return await schedules.toJSON();
    }

}

module.exports = ScheduleEntity;