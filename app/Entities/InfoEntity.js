'use strict';

const { validation, Storage } = require('validator-error-adonis');
const DBException = require('../Exceptions/DBException');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');
const CustomException = require('../Exceptions/CustomException');
const Schedule = use('App/Models/Schedule');
const DB = use('Database');
const { collect } = require('collect.js');
const Info = use('App/Models/Info');

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

}


module.exports = InfoEntity;