'use strict';

const { validation } = require('validator-error-adonis');
const DBException = require('../Exceptions/DBException');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');
const CustomException = require('../Exceptions/CustomException');
const Schedule = use('App/Models/Schedule');
const DB = use('Database');
const { collect } = require('collect.js');
const Info = use('App/Models/Info');
const moment = require('moment');
const SyncScheduleInfosProcedure = require('../Procedures/SyncScheduleInfosProcedure');
const BallotEntity = require('./BallotEntity');
const PermissionEntity = require('./PermissionEntity');
const LicenseEntity = require('./LicenseEntity');

class InfoEntity {

    authentication = {};

    attributes = {
        work_id: "",
        entity_id: "",
        planilla_id: "",
        cargo_id: "",
        type_categoria_id: "",
        meta_id: "",
        plaza: "",
        perfil_laboral_id: "",
        dependencia_id: "",
        situacion_laboral_id: "",
        ruc: "",
        pap: "",
        resolucion: "",
        fecha_de_resolucion: "",
        fecha_de_ingreso: "",
        fecha_de_cese: "",
        observacion: "",
        file: "",
        is_pay: 1,
        estado: 1
    }

    constructor(authentication) {
        this.authentication = authentication;
    }

    schemaPaginate = {
        page: 1,
        perPage: 20,
        query_search: "",
        custom: {}
    }

    handleFilters(obj, filtros = {}) {
        for(let attr in filtros) {
            let value = filtros[attr];
            if (Array.isArray(value)) obj.whereIn(DB.raw(attr), value);
            else if (typeof value != 'undefined' && value !== '' && value !== null) obj.where(DB.raw(attr), value);
        }
        return obj;
    }

    async index (tmpDatos = this.schemaPaginate) {
        let datos = Object.assign(this.schemaPaginate, tmpDatos);
        let infos = Info.query()
            .with('work')
            .with('planilla')
            .with('cargo')
            .with('type_categoria')
            .with('meta')
            .join('works as w', 'w.id', 'infos.work_id')
            .orderBy('w.orden', 'ASC')
            .select('infos.*', 'w.person_id');
        // filtros
        for (let attr in datos.custom) {
            let value = datos.custom[attr];
            if (Array.isArray(value)) {
                if (value.length) infos.whereIn(attr, value);
            } else if (value !== '' && value !== null) infos.where(attr, value);
        }
        // búsqueda
        if (datos.query_search) infos.where('w.orden', 'like', `%${datos.query_search}%`);
        infos = await infos.paginate(datos.page, datos.perPage);
        infos = await infos.toJSON();
        let plucked = collect(infos.data).pluck('person_id').toArray();
        let { people } = await this.authentication.get(`person?page=1&ids=${plucked.join('&ids=')}`)
        .then(res => res.data)
        .catch(err => ({ success: false, people: {} }));
        people = collect(people.data || []);
        // setting data
        infos.data.map(i => {
            i.work = i.work || {};
            i.work.person = people.where('id', i.work.person_id || "").first() || {};
            return i;
        });
        // response
        return infos;
    }

    async store (datos = this.attributes) {
        await validation(null, datos, {
            work_id: "required",
            entity_id: "required",
            planilla_id: "required",
            cargo_id: "required",
            type_categoria_id: "required",
            meta_id: "required",
            perfil_laboral_id: "required",
            dependencia_id: "required",
            situacion_laboral_id: "required",
            pap: "required",
            resolucion: "required",
            fecha_de_resolucion: "required",
            fecha_de_ingreso: "required|dateFormat:YYYY-MM-DD",
            fecha_de_cese: "dateFormat:YYYY-MM-DD",
            observacion: "max:1000"
        });
        // processar
        try {
            // guardar datos
            const info = await Info.create({
                work_id: datos.work_id,
                entity_id: datos.entity_id,
                planilla_id: datos.planilla_id,
                cargo_id: datos.cargo_id,
                type_categoria_id: datos.type_categoria_id,
                meta_id: datos.meta_id,
                plaza: datos.plaza,
                perfil_laboral_id: datos.perfil_laboral_id,
                dependencia_id: datos.dependencia_id,
                situacion_laboral_id: datos.situacion_laboral_id,
                ruc: datos.ruc,
                pap: datos.pap,
                resolucion: datos.resolucion,
                fecha_de_resolucion: datos.fecha_de_resolucion,
                fecha_de_ingreso: datos.fecha_de_ingreso,
                fecha_de_cese: datos.fecha_de_cese,
                observacion: datos.observacion,
                is_pay: 1,
                estado: 1
            });
            // verificar si tiene aportacion
            if (datos.type_aportacion_id) await info.type_aportacions().attach([datos.type_aportacion_id])
            // save
            return info;
        } catch (error) {
            throw new DBException(error, "regístro");
        }
    }

    async show (id, filtros = {}) {
        let info = Info.query()
            .join('works as w', 'w.id', 'infos.work_id')
            .with('work', (build) => {
                build.with('banco')
                    .with('afp')
            })
            .with('planilla')
            .with('cargo')
            .with('type_categoria')
            .with('meta')
            .with('situacion_laboral')
            .where('infos.id', id);
        // filtros
        for (let attr in filtros) {
            let value = filtros[attr];
            if (value) info.where(`infos.${attr}`, value);
        }
        // validar
        info = await info.select('infos.*', 'w.person_id').first();
        if (!info) throw new NotFoundModelException("El Contrato");
        info = await info.toJSON();
        info.work = info.work || {};
        let { person } = await this.authentication.get(`person/${info.person_id || "__error"}`)
        .then(res => res.data)
        .catch(err => ({ person: {} }));
        info.work.person = person;
        // obtener dependencia
        let { dependencia } = await this.authentication.get(`dependencia/${info.dependencia_id || '_error'}`)
        .then(res => res.data)
        .catch(err => ({ success: false, dependencia: {} }));
        info.dependencia = dependencia;
        // obtener perfil laboral
        let { perfil_laboral } = await this.authentication.get(`perfil_laboral/${info.perfil_laboral_id}`)
        .then(res => res.data)
        .catch(err => ({ perfil_laboral: {} }));
        info.perfil_laboral = perfil_laboral;
        // response
        return info;
    }

    async schedules (id, year, month, filtros = {}) {
        let info = Info.query()
            .where('id', id);
        // filtros
        for (let attr in filtros) {
            let value = filtros[attr];
            if (Array.isArray(value)) {
                if (value.length) info.whereIn(attr, value);
            } else if (value != '' && value != null) info.where(attr, value); 
        }
        // obtener info
        info = await info.first();
        if (!info) throw new NotFoundModelException("El contrato");
        // obtener harario
        let schedules = await Schedule.query()
            .where('info_id', info.id)
            .where(DB.raw('YEAR(date)'), year)
            .where(DB.raw('MONTH(date)'), month)
            .orderBy('date', 'ASC')
            .orderBy('time_start', 'ASC')
            .fetch()
        schedules = await schedules.toJSON();
        // response
        return { info, schedules } ;
    }

    async syncSchedules (id, year, month, tmpFiltros = {}) {
        let filtros = Object.assign({}, tmpFiltros);
        delete filtros.cargo_id;
        delete filtros.type_categoria_id;
        let info = await this.show(id, filtros);
        let current_date = moment();
        if ((current_date.year() != year) || (current_date.month() + 1 != month)) throw new CustomException("No se puede sincronizar los horarios");
        let [[[{ rows }]]] = await SyncScheduleInfosProcedure.call({
            info_id: info.id,
            entity_id: info.entity_id,
            planilla_id: info.planilla_id,
            cargo_id: filtros.cargo_id || 0,
            type_categoria_id: filtros.type_categoria_id || 0
        });
        // reponse
        return { info, rows };
    }

    async ballots(id, tmpFiltros = this.schemaPaginate) {
        let filtros = Object.assign(this.schemaPaginate, tmpFiltros);
        let info = Info.query()
            .where('id', id);
        if (filtros.entity_id) info.where('entity_id', filtros.entity_id);
        // obtener
        info = await info.first();
        // eliminat entity_id
        delete filtros.entity_id;
        // validar info
        if (!info) throw new NotFoundModelException("El contrato");
        const ballotEntity = new BallotEntity();
        filtros.custom["s.info_id"] = info.id;
        filtros.perPage = 0;
        let ballots = await ballotEntity.index(filtros);
        return { info, ballots };
    }

    async permissions(id, tmpDatos = this.schemaPaginate, filtros = {}) {
        let datos = Object.assign(this.schemaPaginate, tmpDatos);
        let info = Info.query()
            .where('id', id);
        info = this.handleFilters(info, filtros);
        // obtener
        info = await info.first();
        // validar info
        if (!info) throw new NotFoundModelException("El contrato");
        const permissionEntity = new PermissionEntity();
        datos.custom.info_id = info.id;
        let permissions = await permissionEntity.index(datos);
        return { info, permissions };
    }

    async licenses(id, tmpDatos = this.schemaPaginate, filtros = {}) {
        let datos = Object.assign(this.schemaPaginate, tmpDatos);
        let info = Info.query()
            .where('id', id);
        info = this.handleFilters(info, filtros);
        // obtener
        info = await info.first();
        // validar info
        if (!info) throw new NotFoundModelException("El contrato");
        const licenseEntity = new LicenseEntity();
        datos.custom.info_id = info.id;
        let licenses = await licenseEntity.index(datos);
        return { info, licenses };
    }
}


module.exports = InfoEntity;