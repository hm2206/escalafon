'use strict';

const Info = use('App/Models/Info');
const { validation, ValidatorError } = require('validator-error-adonis');
const ConfigVacation = use('App/Models/ConfigVacation');
const Vacation = use('App/Models/Vacation');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');
const CustomException = require('../Exceptions/CustomException');
const VacationEntity = require('../Entities/VacationEntity');
const DB = use('Database');
const moment = require('moment');

class ConfigVacationEntity {

    attributes = {
        info_id: "",
        year: "",
        scheduled_days: "",
        state: 1
    }

    dataPaginate = {
        page: 1,
        perPage: 20,
        query_search: "",
        custom: {}
    }

    async index(tmpDatos = this.dataPaginate) {
        let datos = Object.assign(this.dataPaginate, tmpDatos);
        let config_vacations = ConfigVacation.query()
        // query search
        if (datos.query_search) config_vacations.where('year', 'like', `%${datos.query_search}%`);
        // filtros avanzados
        for (let attr in datos.custom) {
            let value = datos.custom[attr];
            if (Array.isArray(value)) config_vacations.whereIn(DB.raw(attr), value);
            else if (typeof value != 'undefined' && value != '' && value != null) config_vacations.where(DB.raw(attr), value);
        }
        // pagination
        config_vacations =  datos.perPage 
            ? await config_vacations.paginate(datos.page, datos.perPage) 
            : await config_vacations.fetch();
        config_vacations = await config_vacations.toJSON();
        return config_vacations;
    }

    async store(info = {}, datos = this.attributes) {
        if (!info.id) throw new CustomException("El contrato es inválido!");
        // validar otros datos
        await validation(null, datos, {
            year: 'required|dateFormat:YYYY',
            scheduled_days: 'required|number',
        }); 
        // validar info
        let exists = await Info.find(info.id);
        if (!exists) throw new NotFoundModelException("El contrato");
        // validar si ya existe una configuración
        let existsConfig = await ConfigVacation.query()
            .where('info_id', info.id)
            .where('year', datos.year)
            .getCount('id');
        if (existsConfig) throw new CustomException("Solo se puede tener una configuración anual");
        // procesar información
        try {
            // guardar los datos
            const config_vacation = await ConfigVacation.create({ 
                info_id: info.id,
                year: datos.year,
                scheduled_days: datos.scheduled_days,
            })
            // response
            return config_vacation;
        } catch (error) {
            throw new CustomException("Ocurrio un error al guardar los datos");
        }
    }

    async update(id, datos = this.attributes) {
        await validation(null, datos, {
            scheduled_days: 'required|number'
        });
        // mayor a cero
        if (datos.scheduled_days <= 0) throw new ValidatorError([{ field: 'scheduled_days', message: `Los dias programados deben ser mayor a cero` }]);
        // obtener config_vacation
        let config_vacation = await ConfigVacation.find(id);
        if (!config_vacation) throw new NotFoundModelException("Configucación de vacaciones");
        // obtener total de dias permitidos al año
        const dayOfYear = moment({ year: config_vacation.year, month: 11, day: 21 }).dayOfYear();
        if (dayOfYear < datos.scheduled_days) throw new ValidatorError([{ field: 'scheduled_days', message: `Los dias programados deben ser menor/igual a ${dayOfYear}` }]);
        // validar scheduled_days
        let [{days_used}] = await Vacation.query()
            .where('config_vacation_id', config_vacation.id).sum('days_used as days_used');
        days_used = days_used || 0;
        // validar dias usados
        if (datos.scheduled_days < days_used) throw new ValidatorError([{ 
            field: 'scheduled_days',
            message: `Los dias programados deben ser mayor/igual a: ${days_used}` 
        }]);
        // processar
        try {
            config_vacation.merge({ scheduled_days: datos.scheduled_days });
            await config_vacation.save();
            return config_vacation;
        } catch (error) {   
            throw new CustomException("Ocurrio un error ar guardar los datos");   
        }
    }

    async delete(id) {
        let config_vacation = await ConfigVacation.find(id);
        if (!config_vacation) throw new NotFoundModelException("La configuracion de vacaciones");
        // validar que si existe vacaciones registradas
        let countVacaciones = await Vacation.query()
            .where('config_vacation_id', config_vacation.id)
            .getCount('id');
        if (countVacaciones) throw new CustomException("No puede eliminar la configuración, porque tiene vacaciones registradas");
        // procesar
        try {
            await config_vacation.delete();
        } catch (error) {
            throw new CustomException("No se pudo eliminar la configuración")
        }
    }

    async vacations(id, tmpDatos = this.dataPaginate) {
        let datos = Object.assign(this.dataPaginate, tmpDatos);
        let config_vacation = await ConfigVacation.find(id);
        if (!config_vacation) throw new NotFoundModelException("la configuración de vacaciones");
        datos.config_vacation_id = config_vacation.id;
        const vacationEntity = new VacationEntity();
        const vacations = await vacationEntity.index(datos);
        return { config_vacation, vacations };
    }

}

module.exports = ConfigVacationEntity;