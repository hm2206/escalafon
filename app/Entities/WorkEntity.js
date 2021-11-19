'use strict';

const { validation } = require('validator-error-adonis');
const DBException = require('../Exceptions/DBException');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');
const CustomException = require('../Exceptions/CustomException');
const Info = use('App/Models/Info');
const { collect } = require('collect.js');
const Work = use('App/Models/Work');
const FichaBuilder = require('../Helpers/FichaBuilder');
const ConfigVacationEntity = require('./ConfigVacationEntity');
const PermissionEntity = require('./PermissionEntity');
const LicenseEntity = require('./LicenseEntity');
const ReportVacationBuilder = require('../Helpers/ReportVacationBuilder');
const DB = use('Database');

class WorkEntity {

    authentication = {};

    attributes = {
        person_id: "",
        banco_id: "",
        fecha_de_ingreso: "",
        numero_de_cuenta: "",
        afp_id: "",
        numero_de_cussp: "",
        fecha_de_afiliacion: "",
        numero_de_essalud: "",
        prima_seguro: "",
        code: "",
        orden: "",
        estado: 1 
    }

    schemaPaginate = {
        page: 1,
        perPage: 20,
        query_search: "",
        custom: {}
    }

    constructor(authentication) {
        this.authentication = authentication;
    }

    handleFilters(obj, filtros = {}) {
        for(let attr in filtros) {
            let value = filtros[attr];
            if (Array.isArray(value)) {
                if (!value.length) continue;
                obj.whereIn(attr, value);
                continue;
            }

            if (typeof value != 'undefined' && value !== '' && value !== null) {
                obj.where(DB.raw(attr), value);
                console.log(attr)
                continue;
            }
        }
        return obj;
    }

    async index (page = 1, query_search = "", filtros = {}, entity_id = "", cargo_id = "", perPage = 20) {
        let works = Work.query()
            .orderBy('orden', 'ASC');
        if (query_search) works.where('orden', 'like', `%${query_search}%`);
        // filtros
        for(let attr in filtros) {
            let value = filtros[value];
            if (value) works.where(attr, value); 
        }
        // obtener contador de contratos
        works.withCount('infos', (builder) => {
            builder.where('estado', 1)
            if (entity_id) builder.where('entity_id', entity_id)
        });
        // filtro por cargo_id
        if (cargo_id) works.whereHas('infos', (builder) => {
            builder.where('cargo_id', cargo_id)
            builder.where('estado', 1)
        })
        // obtener trabajadores
        works = await works.paginate(page, perPage);
        works = await works.toJSON();
        let plucked = collect(works.data).pluck('person_id').toArray();
        let { people } = await this.authentication.get(`person?page=1&ids=${plucked.join('&ids=')}`)
        .then(res => res.data)
        .catch(err => ({ success: false, people: {} }));
        people = collect(people.data || []);
        // setting data
        works.data.map(w => {
            w.person = people.where('id', w.person_id).first() || {};
            return w;
        });
        // response
        return works;
    }

    async store (datos = this.attributes) {
        await validation(null, datos, {
            person_id: "required",
            fecha_de_ingreso: "required|dateFormat:YYYY-MM-DD",
            banco_id: "required",
            afp_id: "required",
            prima_seguro: "number",
            fecha_de_afiliacion: "dateFormat:YYYY-MM-DD"
        });
        // validar person_id
        let { success, person } = await this.authentication.get(`person/${datos.person_id}`)
            .then(res => res.data)
            .catch(err => ({ success: false, person: {} }));
        if (!success) throw new NotFoundModelException("La Persona");
        // validar work
        let is_work = await Work.query()
            .where('person_id', person.id)
            .getCount('id');
        if (is_work) throw new CustomException("El trabajador ya exíste!");
        // guardar
        try {
            const work = await Work.create({
                person_id: datos.person_id,
                fecha_de_ingreso: datos.fecha_de_ingreso,
                banco_id: datos.banco_id,
                numero_de_cuenta: datos.numero_de_cuenta,
                afp_id: datos.afp_id,
                numero_de_cussp: datos.numero_de_cussp,
                fecha_de_afiliacion: datos.fecha_de_afiliacion,
                numero_de_essalud: datos.numero_de_essalud,
                prima_seguro: datos.prima_seguro ? 1 : 0,
                code: datos.code,
                orden: datos.orden,
                estado: 0
            });
            // response
            work.person = person;
            return work;
        } catch (error) {
            throw new DBException(error, "regístro");
        }
    }

    async show (id) {
        let work = await Work.query()
            .with('afp')
            .with('banco')
            .where('id', id || '__error')
            .first();
        if (!work) throw new NotFoundModelException("El trabajador");
        let { person } = await this.authentication.get(`person/${work.person_id}`)
        .then(res => res.data)
        .catch(err => ({ success: true, person: {} }));
        work.person = person;
        return work;
    }

    async update (id, datos = this.attributes) {
        let work = await this.show(id);
        await validation(null, datos, {
            fecha_de_ingreso: "required|dateFormat:YYYY-MM-DD",
            banco_id: "required",
            afp_id: "required",
            fecha_de_afiliacion: "dateFormat:YYYY-MM-DD"
        });
        // procesar
        try {
            // preparar datos
            let payload = {
                fecha_de_ingreso:  datos.fecha_de_ingreso,
                banco_id: datos.banco_id,
                numero_de_cuenta: datos.numero_de_cuenta,
                afp_id: datos.afp_id,
                numero_de_cussp: datos.numero_de_cussp,
                fecha_de_afiliacion: datos.fecha_de_afiliacion,
                numero_de_essalud: datos.numero_de_essalud,
                prima_seguro: datos.prima_seguro ? 1 : 0
            };
            // guardar datos
            await Work.query()
                .where('id', work.id)
                .update(payload);
            work = work.toJSON();
            work = { ...work, ...payload };
            // response
            return work
        } catch (error) {
            throw new DBException("regístro");
        }
    }

    async ficha (id, filters = {}) {
        let work = await this.show(id);
        work = await work.toJSON();
        const fichaBuilder = new FichaBuilder(work, filters);
        return await fichaBuilder.execute();
    }

    async infos (id, tmpDatos = this.schemaPaginate) {
        let datos = Object.assign(this.schemaPaginate, tmpDatos);
        let work = await this.show(id);
        let infos = Info.query()
            .orderBy('estado', 'DESC')
            .orderBy('fecha_de_ingreso', 'DESC')
            .with('planilla')
            .with('cargo')
            .with('type_categoria')
            .with('meta')
            .where('work_id', work.id);
        // validar dependencia
        if (datos.principal != null ) infos.whereHas('planilla', (builder) => builder.where('principal', datos.principal));
        // custom
        infos = this.handleFilters(infos, datos.custom);
        // obtener
        infos = datos.perPage ? await infos.paginate(datos.page, datos.perPage) : await infos.fetch();
        infos = await infos.toJSON();
        await infos.data.map(i => {
            i.work = work;
            return i;
        });
        // response
        return { work, infos } ;
    }

    async config_vacations(id, filtros = {}, tmpdatos = this.schemaPaginate) {
        let datos = Object.assign(this.schemaPaginate, tmpdatos);
        let work = Work.query()
            .where('id', id);
        // filtros
        for (let attr in filtros) {
            let value = filtros[attr];
            if(Array.isArray(value)) work.whereIn(DB.raw(attr), value);
            else if(typeof value != 'undefined' && value != '' && value != null) work.where(DB.raw(attr), value);
        }
        // obtener info
        work = await work.first();
        // validar info
        if (!work) throw new NotFoundModelException("El contrato");
        datos.custom.work_id = work.id;
        const configVacationEntity = new ConfigVacationEntity();
        const config_vacations = await configVacationEntity.index(datos);
        return { work, config_vacations };
    }

    async reportVacations(id, entity, type = 'pdf') {
        let filters = { work_id: id };
        const reportVacationBuilder = new ReportVacationBuilder(this.authentication, entity, filters, type);
        return await reportVacationBuilder.render();
    }

}


module.exports = WorkEntity;