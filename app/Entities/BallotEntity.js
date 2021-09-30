'use strict';

const { validation, ValidatorError } = require('validator-error-adonis');
const moment = require('moment');
const Ballot = use('App/Models/Ballot');
const Schedule = use('App/Models/Schedule');
const DB = use('Database');
const CustomException = require('../Exceptions/CustomException');
const NotFoundModelException = require('../Exceptions/NotFoundModelException')

class BallotEntity {

    allowMotivos = ['FUERA_DE_HORA', 'MOTIVOS_PARTICULARES', 'SALUD', 'COMISION_DE_SERVICIO']
    attributes = {
        schedule_id: "",
        ballot_number: "",
        motivo: "",
        modo: "",
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
            .with('schedule')
            .select('ballots.*')
            .join('schedules as s', 's.id', 'ballots.schedule_id')
        // query_search
        if (filtros.query_search) ballots.where(DB.raw(`
            (ballots.ballot_number like "%${filtros.query_search}%" OR 
            ballots.justification like "%${filtros.query_search}%")`
        ));
        // filtros personalizados
        for (let attr in filtros.custom) {
            let value = filtros.custom[attr];
            if (Array.isArray(value)) ballots.whereIn(DB.raw(attr), value);
            else if (typeof value != 'undefined' || value !== '' || value !== null) ballots.where(DB.raw(attr), value);
        }
        // obtener registros
        ballots = filtros.perPage == 0 ? await ballots.fetch() : await ballots.paginate(filtros.page, filtros.perPage);
        // response
        return await ballots.toJSON();
    }

    async store(datos = this.attributes, filtros = {}) {
        await validation(null, datos, {
            schedule_id: "required",
            ballot_number: "required",
            motivo: "required|max:255",
            modo: "required",
            time_over: "required",
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
            datos[attr] = moment(value, 'HH:mm').format('HH:mm:ss');
        }
        // validar times por modo
        if (datos.modo == 'ENTRY' && !datos.time_start) throw new ValidatorError([{ field: 'time_start', message: `La hora de ingreso es requerido!` }]);
        else if (datos.modo == 'EXIT' && !datos.time_return) throw new ValidatorError([{ field: 'time_return', message: `La hora de retorno es requerido!` }]);
        // crear papeleta
        try {
            // save
            const ballot = await Ballot.create({
                schedule_id: datos.schedule_id,
                ballot_number: datos.ballot_number,
                motivo: datos.motivo,
                modo: datos.modo,
                is_applied: datos.is_applied ? 1 : 0,
                time_start: datos.time_start,
                time_over: datos.time_over,
                time_return: datos.time_return || null,
                justification: datos.justification || ""
            })
            // agregar schedule
            ballot.schedule = schedule;
            // response 
            return ballot;
        } catch (error) {
            throw new CustomException("No se puede guardar la papeleta");
        }
    }

    async update(id, datos = this.attributes, filtros = {}) {
        await validation(null, datos, {
            schedule_id: 'required',
            ballot_number: "required",
            motivo: "required|max:255",
            time_over: "required",
            justification: "max:1000"
        });
        // obtener ballot
        let ballot = await Ballot.find(id);
        if (!ballot) throw new NotFoundModelException("La papeleta");
        // obtener schedule
        let schedule = Schedule.query()
            .join('infos as i', 'i.id', 'schedules.info_id')
            .where('schedules.id', ballot.schedule_id)
        // filtros
        for (let attr in filtros) {
            let value = filtros[attr];
            if (Array.isArray(value)) schedule.whereIn(attr, value);
            else if (value !== '' && value !== null) schedule.where(attr, value);
        }
        // obtener schedule
        schedule = await schedule.select('schedules.*').first();
        if (!schedule) throw new NotFoundModelException("El horario");
        if (!this.allowMotivos.includes(datos.motivo)) throw new ValidatorError([{ field: 'motivos', message: "El motivo es invalido!" }]);
        // validar times
        let formatTime = ['time_start', 'time_over', 'time_return'];
        for (let attr of formatTime) {
            let value = datos[attr];
            if (!value) continue;
            let isValid = await moment(value, 'HH:mm').isValid();
            if (!isValid) throw new ValidatorError([{ field: attr, message: `El formato no es válido!` }])
            datos[attr] = moment(value, 'HH:mm').format('HH:mm:ss');
        }
        // validar times por modo
        if (datos.modo == 'ENTRY' && !datos.time_start) throw new ValidatorError([{ field: 'time_start', message: `La hora de ingreso es requerido!` }]);
        else if (datos.modo == 'EXIT' && !datos.time_return) throw new ValidatorError([{ field: 'time_return', message: `La hora de retorno es requerido!` }]);
        // actualizar
        try {
            // preparar cambios
            ballot.merge({
                schedule_id: datos.schedule_id,
                ballot_number: datos.ballot_number,
                motivo: datos.motivo,
                modo: datos.modo,
                is_applied: datos.is_applied ? 1 : 0,
                time_start: datos.time_start,
                time_over: datos.time_over,
                time_return: datos.time_return || null,
                justification: datos.justification || ""
            })
            // guardar cambios
            await ballot.save();
            // response 
            return ballot;
        } catch (error) {
            throw new CustomException("No se puedó guardar los cambios de la papeleta");
        }
    }

    async delete(id) {
        let ballot = await Ballot.find(id);
        if (!ballot) throw new NotFoundModelException("La papeleta");
        let schedule = await Schedule.find(ballot.schedule_id);
        if (!schedule) throw new NotFoundModelException("El horario");
        let current_fecha = moment(`${moment().format('YYYY-MM')}-01`);
        let select_fecha = moment(`${moment(schedule.date).format('YYYY-MM')}-01`);
        let diff = select_fecha.diff(current_fecha, 'months').valueOf() >= 0;
        if (!diff) throw new CustomException("No está permitido eliminar la papeleta");
        // eliminar
        try {
            return await ballot.delete();
        } catch (error) {
            throw new CustomException("No se pudó eliminar la papeleta")
        }
    }

}

module.exports = BallotEntity;