'use strict';

const { validation, ValidatorError } = require('validator-error-adonis');
const ConfigVacation = use('App/Models/ConfigVacation');
const Vacation = use('App/Models/Vacation');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');
const CustomException = require('../Exceptions/CustomException');
const moment = require('moment');

class VacationEntity {

    attributes = {
        config_vacation_id: "",
        date_start: "",
        date_over: "",
        days_used: "",
        observation: "",
        state: 1
    }

    async store(config_vacation = {}, datos = this.attributes) {
        // obtener config_vacation
        let exists = await ConfigVacation.find(config_vacation.id || "__error");
        if (!exists) throw new NotFoundModelException("La configuración de vacaciones");
        // validar datos
        await validation(null, datos, {
            date_start: "required|dateFormat:YYYY-MM-DD",
            date_over: "required|dateFormat:YYYY-MM-DD",
            observation: "max:1000"
        });
        // diff dias
        let date_start = moment(datos.date_start);
        let date_over = moment(datos.date_over);
        let duration = date_over.diff(date_start, 'days').valueOf();
        duration = duration > 0 ? duration + 1 : 0;
        // validar year start
        if (date_start.year() != config_vacation.year) throw new ValidatorError([{
            field: 'date_start', message: `La fecha de inicio debe ser del año ${config_vacation.year}`
        }]);
        // validar year over
        if (date_over.year() != config_vacation.year) throw new ValidatorError([{
            field: 'date_start', message: `La fecha de fin debe ser del año ${config_vacation.year}`
        }]);
        // validar fechas
        if (datos.date_over <= datos.date_start) throw new ValidatorError([{
            field: 'date_over', message: `La fecha de fin debe ser mayor a ${datos.date_start}`
        }])
        // obtener dias usados
        let [{days_used}] = await Vacation.query()
            .where('config_vacation_id', config_vacation.id)
            .sum('days_used as days_used');
        days_used = days_used || 0; 
        // validar dias disponibles
        let saldo_days = config_vacation.scheduled_days - days_used;
        let total_days_used = days_used + duration;
        let diff_days_used =  config_vacation.scheduled_days - total_days_used;
        if (diff_days_used < 0) throw new CustomException(`El contrato solo cuenta con ${saldo_days} días disponibles de vacaciones`);
        // procesar
        try {
            // guardar datos
            return Vacation.create({ 
                config_vacation_id: config_vacation.id,
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
            date_start: 'required|dateFormat:YYYY-MM-DD',
            date_over: 'required|dateFormat:YYYY-MM-DD',
            observation: 'max:1000'
        });
        // obtener vacation
        let vacation = await Vacation.find(id);
        if (!vacation) throw new NotFoundModelException("la vacación");
        let config_vacation = await ConfigVacation.find(vacation.config_vacation_id);
        if (!config_vacation) throw new NotFoundModelException("la configuración de vacaciones");
        // diff dias
        let date_start = moment(datos.date_start);
        let date_over = moment(datos.date_over);
        let duration = date_over.diff(date_start, 'days').valueOf();
        duration = duration > 0 ? duration + 1 : 0;
        // validar year start
        if (date_start.year() != config_vacation.year) throw new ValidatorError([{
            field: 'date_start', message: `La fecha de inicio debe ser del año ${config_vacation.year}`
        }]);
        // validar year over
        if (date_over.year() != config_vacation.year) throw new ValidatorError([{
            field: 'date_start', message: `La fecha de fin debe ser del año ${config_vacation.year}`
        }]);
        // validar fechas
        if (datos.date_over <= datos.date_start) throw new ValidatorError([{
            field: 'date_over', message: `La fecha de fin debe ser mayor a ${datos.date_start}`
        }])
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