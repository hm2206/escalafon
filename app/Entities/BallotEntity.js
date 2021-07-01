'use strict';

const { validation, ValidatorError } = require('validator-error-adonis');
const moment = require('moment');
const Ballot = use('App/Models/Ballot');
const Schedule = use('App/Models/Schedule');
const DB = use('Database');
const CustomException = require('../Exceptions/CustomException');

class BallotEntity {

    allowMotivos = ['FUERA_DE_HORA', 'MOTIVOS_PARTICULARES', 'SALUD', 'COMISION_DE_SERVICIO']
    attributes = {
        schedule_id: "",
        ballot_number: "",
        motivo: "",
        time_start: "",
        time_over: "",
        time_return: "",
        total: 0,
        justification: ""
    }

    dataPaginate = {
        page: 1,
        perPage: 20,
        query_search: "",
        custom: {}
    }

    async index (tmpFiltros = this.dataPaginate) {
        let filtros = Object.assign(this.dataPaginate, tmpFiltros);
        let ballots = Ballot.query()
            .join('schedules as s', 's.id', 'ballots.schedule_id')
            .with('schedule')
        // query_search
        if (filtros.query_search) ballots.where(DB.raw(`
            (ballots.ballot_number like "%${filtros.query_search}%" OR 
            ballots.justification like "%${filtros.query_search}%")`
        ));
        // filtros personalizados
        for (let attr in filtros.custom) {
            let value = filtros.custom[attr];
            if (Array.isArray(value)) ballots.whereIn(attr, value);
            else if (typeof value != 'undefined' || value !== '' || value !== null) ballots.where(attr, value);
        }
        // obtener registros
        ballots = await ballots.select('ballots.*')
            .paginate(filtros.page, filtros.perPage);
        // response
        return await ballots.toJSON();
    }

    async store(datos = this.attributes, filtros = {}) {
        await validation(null, datos, {
            schedule_id: "required",
            ballot_number: "required",
            motivo: "required|max:255",
            time_start: "required",
            time_over: "required",
            total: "number",
            justification: "max:1000"
        });
        // obtener schedule
        let schedule = Schedule.query()
            .join('infos as i', 'i.id', 'schedules.info_id')
            .where('schedules.id', datos.schedule_id)
        // filtros
        for (let attr in filtros) {
            let value = filtros[attr];
            if (Array.isArray(value)) schedule.whereIn(attr, value);
            else if (value !== '' && value !== null) schedule.where(attr, value);
        }
        // obtener schedule
        schedule = await schedule.select('schedules.*').first();
        if (!schedule) throw new ValidatorError([{ field: 'schedule_id', message: "El horario no existe!" }])
        if (!this.allowMotivos.includes(datos.motivo)) throw new ValidatorError([{ field: 'motivos', message: "El motivo es invalido!" }]);
        // validar times
        let formatTime = ['time_start', 'time_over', 'time_return'];
        for (let attr of formatTime) {
            let value = datos[attr];
            if (!value) continue;
            let isValid = await moment(value, 'HH:mm').isValid();
            if (!isValid) throw new ValidatorError([{ field: attr, message: `El formato no es válido!` }])
        }
        // crear papeleta
        try {
            // save
            const ballot = await Ballot.create({
                schedule_id: datos.schedule_id,
                ballot_number: datos.ballot_number,
                motivo: datos.motivo,
                time_start: datos.time_start,
                time_over: datos.time_over,
                time_return: datos.time_return || null,
                total: datos.total || 0,
                justification: datos.justification || ""
            })
            // response 
            return ballot;
        } catch (error) {
            console.log(error)
            throw new CustomException("No se puede guardar la papeleta");
        }
    }

}

module.exports = BallotEntity;