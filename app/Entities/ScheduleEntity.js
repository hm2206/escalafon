'use strict';

const { validation, ValidatorError } = require('validator-error-adonis');
const { collect } = require("collect.js");
const DBException = require('../Exceptions/DBException');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');
const Schedule = use('App/Models/Schedule');
const Info = use('App/Models/Info');
const Assistance = use('App/Models/Assistance');
const DB = use('Database');
const moment = require("moment");
moment.locale('es');

class ScheduleEntity {

    attributes = {
        info_id: "",
        index: "",
        date: "",
        time_start: "",
        time_over: "",
        delay_start: "",
        delay_over: ""
    }

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

    async store (datos = this.attributes) {
        await validation(null, datos, {
            info_id: "required",
            date: "required|dateFormat:YYYY-MM-DD",
            time_start: "required",
            time_over: "required",
            delay_start: 'number',
            delay_over: 'number'
        });
        // validar formatos
        let formatTime = ['time_start', 'time_over'];
        for (let f of formatTime) {
            let value = datos[f];
            if (!value) continue;
            let is_time = await moment(new Date(`${datos.date} ${value}`)).isValid();
            if (!is_time) throw new ValidatorError([{ field: f, message: `El formado del campo ${f} no es corresponde a HH:mm:ss` }]);
        }
        // validar fecha  
        let current_fecha = moment(`${moment().format('YYYY-MM')}-01`);
        let select_fecha = moment(`${moment(datos.date).format('YYYY-MM')}-01`);
        let isDeny = current_fecha.diff(select_fecha, 'months').valueOf();
        if (isDeny >= 1) throw new ValidatorError([{ field: 'date', message: `La fecha debe ser mayor/igual a 01/${moment().format('MM/YYYY')}` }]);
        // validar contrato que esté activo
        let info = await Info.query()
            .where('id', datos.info_id)
            .where('estado', 1)
            .first();
        if (!info) throw NotFoundModelException("El contrato");
        // formatear times
        datos.time_start = `${moment(datos.time_start, 'HH:mm:ss').format('HH:mm')}:00`
        datos.time_over = `${moment(datos.time_over, 'HH:mm:ss').format('HH:mm')}:00`
        // guardar horario
        try {
            return await Schedule.create({
                info_id: datos.info_id,
                date: datos.date,
                time_start: datos.time_start,
                time_over: datos.time_over,
                delay_start: datos.delay_start || 0,
                delay_over: datos.delay_over || 0,
                index: moment(datos.date).day(),
                observation: datos.observation || null
            });
        } catch (error) {
            throw new DBException(error, "regístro");
        }
    }

    async update (id, datos = this.attributes, filtros = {}) {
        await validation(null, {
            date: "required|dateFormat:YYYY-MM-DD",
            time_start: "required",
            time_over: "required",
            delay_start: 'number',
            delay_over: 'number'
        });
        // validar formatos
        let formatTime = ['time_start', 'time_over'];
        for (let f of formatTime) {
            let value = datos[f];
            if (!value) continue;
            let is_time = await moment(new Date(`${datos.date} ${value}`)).isValid();
            if (!is_time) throw new ValidatorError([{ field: f, message: `El formado del campo ${f} no es corresponde a HH:mm:ss` }]);
        }
        // horario
        let schedule = Schedule.query()
            .join('infos as i', 'i.id', 'schedules.info_id')
            .where('i.estado', 1)
            .where('schedules.id', id)
            .select('schedules.*');
        // filtrar
        for (let attr in filtros) {
            let value = filtros[attr];
            if (Array.isArray(value)) {
                if (value.length) schedule.whereIn(attr, value);
            } else if (value != '' && value != null) schedule.where(attr, value);
        }
        // validar fecha  
        let current_fecha = moment(`${moment().format('YYYY-MM')}-01`);
        let select_fecha = moment(`${moment(datos.date).format('YYYY-MM')}-01`);
        let isDeny = current_fecha.diff(select_fecha, 'months').valueOf();
        if (isDeny >= 1) throw new ValidatorError([{ field: 'date', message: `La fecha debe ser mayor/igual a 01/${moment().format('MM/YYYY')}` }]);
        // obtener horario
        schedule = await schedule.first();
        if (!schedule) throw new NotFoundModelException("El horario");
        // validar 
        let current_date = moment(new Date(`${moment().format('YYYY-MM')}-01`));
        let select_date = moment(new Date(`${moment(schedule.date).format('YYYY-MM')}-01`));
        let isAllow = current_date.diff(select_date, 'months').valueOf() <= 0 ? true : false;
        if (!isAllow) throw new Error("No se puede eliminar el horario!!!");
        // validar assistance
        let is_asssistances = await Assistance.query()
            .where('schedule_id', schedule.id)
            .getCount('id');
        if (is_asssistances) throw new Error("No se puede actualizar el horario!!!");
        // formatear times
        datos.time_start = `${moment(datos.time_start, 'HH:mm:ss').format('HH:mm')}:00`
        datos.time_over = `${moment(datos.time_over, 'HH:mm:ss').format('HH:mm')}:00`
        // actualizar
        schedule.merge({ 
            time_start: datos.time_start,
            time_over: datos.time_over,
            delay_start: datos.delay_start,
            delay_over: datos.delay_over,
            observation: datos.observation || null
        });
        // guardar cambios
        await schedule.save();
        // response
        return schedule;
    }

    async delete (id, filtros = {}) {
        let schedule = Schedule.query()
            .join('infos as i', 'i.id', 'schedules.info_id')
            .where('i.estado', 1)
            .where('schedules.id', id)
            .select('schedules.*');
        // filtrar
        for (let attr in filtros) {
            let value = filtros[attr];
            if (Array.isArray(value)) {
                if (value.length) schedule.whereIn(attr, value);
            } else if (value != '' && value != null) schedule.where(attr, value);
        }
        // obtener
        schedule = await schedule.first();
        if (!schedule) throw new NotFoundModelException("El horario");
        // validar 
        let current_date = moment(new Date(`${moment().format('YYYY-MM')}-01`));
        let select_date = moment(new Date(`${moment(schedule.date).format('YYYY-MM')}-01`));
        let isAllow = current_date.diff(select_date, 'months').valueOf() <= 0 ? true : false;
        if (!isAllow) throw new Error("No se puede eliminar el horario!!!");
        // validar assistance
        let is_asssistances = await Assistance.query()
            .where('schedule_id', schedule.id)
            .getCount('id');
        if (is_asssistances) throw new Error("No se puede elimnar el horario!!!");
        // eliminar
        await schedule.delete();
        // response
        return schedule;
    }

    async replicar (id, filtros = {}) {
        let schedule = Schedule.query()
            .join('infos as i', 'i.id', 'schedules.info_id')
            .where('i.estado', 1)
            .where('schedules.id', id)
            .select('schedules.*');
        // filtrar
        for (let attr in filtros) {
            let value = filtros[attr];
            if (Array.isArray(value)) {
                if (value.length) schedule.whereIn(attr, value);
            } else if (value != '' && value != null) schedule.where(attr, value);
        }
        // obtener
        schedule = await schedule.first();
        if (!schedule) throw new NotFoundModelException("El horario");
        // validar 
        let current_date = moment(new Date(`${moment().format('YYYY-MM')}-01`));
        let select_date = moment(new Date(`${moment(schedule.date).format('YYYY-MM')}-01`));
        let isAllow = current_date.diff(select_date, 'months').valueOf() <= 0 ? true : false;
        if (!isAllow) throw new Error("No se puede replicar el horario!!!");
        let fecha = moment(schedule.date);
        // obtener schedules para obiar
        let except_schedules = await Schedule.query()
            .where('info_id', schedule.info_id)
            .where('index', schedule.index)
            .where(DB.raw('YEAR(date)'), fecha.year())
            .where(DB.raw('MONTH(date)'), fecha.month() + 1)
            .orderBy('date', 'DESC')
            .orderBy('time_over', 'DESC')
            .fetch();
        except_schedules = collect(await except_schedules.toJSON());
        // obtener fecha de inicio y final
        let date_start = moment(`${moment(schedule.date).format('YYYY-MM')}-01`).format('YYYY-MM-DD');
        let date_over = moment(moment(date_start).add(1, 'months').subtract(1, 'days')).format('YYYY-MM-DD');
        // obtener dia start y over
        let day_start = parseInt(moment(date_start).format('D'));
        let day_over = parseInt(moment(date_over).format('D'));
        // generar arrays
        let dates = [];
        for (let day = day_start; day <= day_over; day++) {
            let current_date = moment(date_start);
            let current_year = current_date.year();
            let current_month = current_date.month() + 1;
            let new_date = moment(new Date(`${current_year}-${current_month}-${day}`));
            let index = new_date.day();
            if (index != schedule.index) continue;
            let isDeny = except_schedules.where('date', new_date.format('YYYY-MM-DD'))
                .where('index', index)
                .where('time_start', schedule.time_start)
                .where('time_over', schedule.time_over)
                .first();
            if (isDeny) continue;
            // add insert massive
            dates.push({
                info_id: schedule.info_id,
                index,
                date: new_date.format('YYYY-MM-DD'),
                time_start: schedule.time_start,
                time_over: schedule.time_over,
                delay_start: schedule.delay_start,
                delay_over: schedule.delay_over,
                observation: schedule.observation
            });
        }
        // agregar schedules
        try {
            let schedules = await Schedule.createMany(dates);
            return { schedule, schedules };
        } catch (error) {
            throw new DBException(error, 'regíster');
        }
    }
    
}

module.exports = ScheduleEntity;