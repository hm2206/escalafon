'use strict';

const { validation, ValidatorError } = require('validator-error-adonis');
const ConfigVacation = use('App/Models/ConfigVacation');
const Vacation = use('App/Models/Vacation');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');
const CustomException = require('../Exceptions/CustomException');
const moment = require('moment');
const DB = use('Database');

class VacationEntity {

    attributes = {
        config_vacation_id: "",
        resolucion: "",
        date_start: "",
        date_over: "",
        days_used: "",
        observation: "",
        state: 1
    }

    schemaPaginate = {
        page: 1,
        perPage: 20,
        query_search: "",
        custom: {}
    }

    async index(tmpDatos = this.schemaPaginate) {
        let datos = Object.assign(this.schemaPaginate, tmpDatos);
        let vacations = Vacation.query()
            .orderBy('date_start', 'ASC');
        // filtros avanzados
        for(let attr in datos.custom) {
            let value = datos.custom[attr];
            if (Array.isArray(value)) vacations.whereIn(DB.raw(attr), value);
            else if (typeof value != 'undefined' && value != '' && value != null) vacations.where(DB.raw(attr), value);
        }
        // obtener datos
        vacations = datos.perPage ? await vacations.paginate(datos.page, datos.perPage) : await vacations.fetch();
        vacations = await vacations.toJSON();
        return vacations;
    }

    async store(config_vacation = {}, datos = this.attributes) {
        // obtener config_vacation
        let exists = await ConfigVacation.find(config_vacation.id || "__error");
        if (!exists) throw new NotFoundModelException("La configuración de vacaciones");
        // validar datos
        await validation(null, datos, {
            resolucion: "required|max:255",
            date_start: "required|dateFormat:YYYY-MM-DD",
            date_over: "required|dateFormat:YYYY-MM-DD",
            observation: "max:1000"
        });
        // validar fechas
        if (datos.date_over < datos.date_start) throw new ValidatorError([{
            field: 'date_over', message: `La fecha de fin debe ser mayor a ${datos.date_start}`
        }])
        // diff dias
        let date_start = moment(datos.date_start);
        let date_over = moment(datos.date_over);
        // validar año
        if (date_start.year() < config_vacation.year) throw new ValidatorError([{
            field: 'date_start', message: `La fecha de inicio debe ser mayor/igual a ${config_vacation.year}`
        }]);
        // validar duracion
        let duration = date_over.diff(date_start, 'days').valueOf() + 1;
        // obtener dias usados
        let [{days_used}] = await Vacation.query()
            .where('config_vacation_id', config_vacation.id)
            .sum('days_used as days_used');
        days_used = days_used || 0; 
        // validar dias disponibles
        let saldo_days = config_vacation.scheduled_days - days_used;
        let total_days_used = days_used + duration;
        let diff_days_used =  config_vacation.scheduled_days - total_days_used;
        if (diff_days_used < 0) throw new CustomException(`El trabajador solo cuenta con ${saldo_days} días disponibles de vacaciones`);
        // procesar
        try {
            // guardar datos
            return Vacation.create({ 
                config_vacation_id: config_vacation.id,
                resolucion: datos.resolucion,
                date_start: datos.date_start,
                date_over: datos.date_over,
                observation: datos.observation
            });
        } catch (error) {
            throw new CustomException("No se puedo guardar los datos");
        }
    }

    async update(id, datos = this.attributes) {
        await validation(null, datos, {
            resolucion: "required|max:255",
            date_start: 'required|dateFormat:YYYY-MM-DD',
            date_over: 'required|dateFormat:YYYY-MM-DD',
            observation: 'max:1000'
        });
        // validar fechas
        if (datos.date_over <= datos.date_start) throw new ValidatorError([{
            field: 'date_over', message: `La fecha de fin debe ser mayor a ${datos.date_start}`
        }])
        // obtener vacation
        let vacation = await Vacation.find(id);
        if (!vacation) throw new NotFoundModelException("la vacación");
        let config_vacation = await ConfigVacation.find(vacation.config_vacation_id);
        if (!config_vacation) throw new NotFoundModelException("la configuración de vacaciones");
        // diff dias
        let date_start = moment(datos.date_start);
        let date_over = moment(datos.date_over);
        // validar año
        if (date_start.year() < config_vacation.year) throw new ValidatorError([{
            field: 'date_start', message: `La fecha de inicio debe ser mayor/igual a ${config_vacation.year}`
        }]);
        // obtener duración
        let duration = date_over.diff(date_start, 'days').valueOf() + 1;
        // obtener dias usados
        let [{days_used}] = await Vacation.query()
            .where('config_vacation_id', config_vacation.id)
            .where('id', '<>', vacation.id)
            .sum('days_used as days_used');
        days_used = days_used || 0; 
        // validar dias disponibles
        let saldo_days = config_vacation.scheduled_days - days_used;
        let total_days_used = days_used + duration;
        let diff_days_used =  config_vacation.scheduled_days - total_days_used;
        if (diff_days_used < 0) throw new CustomException(`El contrato solo cuenta con ${saldo_days} días disponibles de vacaciones`);
        // procesar
        try {
            // preparar cambios
            vacation.merge({
                resolucion: datos.resolucion,
                date_start: datos.date_start,
                date_over: datos.date_over,
                observation: datos.observation
            });
            // save datos
            await vacation.save();
            return vacation;
        } catch (error) {
            throw new CustomException("No se puede guardar los cambios");
        }
    }

    async delete(id) {
        let vacation = await Vacation.find(id);
        if (!vacation) throw new NotFoundModelException("la vacación");
        // procesar
        try {
            return await vacation.delete();
        } catch (error) {
            throw new CustomException("No se pudo eliminar el regístro");
        }
    }

}

module.exports = VacationEntity;