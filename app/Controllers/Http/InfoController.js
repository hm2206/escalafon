'use strict';

const InfoEntity = require('../../Entities/InfoEntity');
const collect = require('collect.js');
const moment = require('moment');
const NotFoundModelException = require('../../Exceptions/NotFoundModelException');
const Ascent = use('App/Models/Ascent');
const Info = use('App/Models/Info');
const Displacement = use('App/Models/Displacement')
const Merit = use('App/Models/Merit')

class InfoController {

    async index({ request }) {
        let page = request.input('page', 1);
        let query_search = request.input('query_search', '');
        let principal = request.input('principal', null);
        const entity = request.$entity;
        let filtros = request.only(['planilla_id', 'cargo_id', 'type_categoria_id', 'meta_id']);
        let states = collect(request.collect(['estado'])).pluck('estado').toArray();
        filtros['infos.entity_id'] = entity.id;
        filtros['infos.estado'] = states;
        filtros['p.principal'] = principal;
        let authentication = request.api_authentication;
        const infoEntity = new InfoEntity(authentication);
        const infos = await infoEntity.index({ page, query_search, custom: filtros });
        return {
            success: true,
            status: 201,
            infos
        }
    }

    async store({ request }) {
        const entity = request.$entity;
        let authentication = request.api_authentication;
        let payload = request.all();
        payload.entity_id = entity.id;
        const infoEntity = new InfoEntity(authentication);
        const info = await infoEntity.store(payload);
        // response
        return {
            success: true,
            status: 201,
            message: "Los datos se guardarón correctamente!",
            info,
        }
    }

    async show ({ params, request }) {
        const entity = request.$entity;
        let authentication = request.api_authentication;
        const infoEntity = new InfoEntity(authentication);
        const info = await infoEntity.show(params.id, { entity_id: entity.id });
        return {
            success: true,
            status: 200,
            info
        }
    }

    async schedules ({ params, request }) {
        const entity = request.$entity;
        let authentication = request.api_authentication;
        const year = request.input('year', moment().year());
        const month = request.input('month', moment().month() + 1);
        const infoEntity = new InfoEntity(authentication);
        const { info, schedules } = await infoEntity.schedules(params.id, year, month, { entity_id: entity.id });
        return {
            success: true,
            status: 200,
            info,
            schedules
        }
    }

    async syncSchedules ({ params, request }) {
        const entity = request.$entity;
        let authentication = request.api_authentication;
        let year = request.input('year', moment().year());
        let month = request.input('month', moment().month() + 1);
        const infoEntity = new InfoEntity(authentication);
        let { info, rows } = await infoEntity.syncSchedules(params.id, year, month, { entity_id : entity.id });
        return {
            success: true,
            status: 200,
            message: `Se sincronizarón ${rows} horarios a los contratos!`
        }
    }
    
    async ballots ({ params, request }) {
        const entity = request.$entity;
        const date = moment();
        let authentication = request.api_authentication;
        const page = request.input('page', 1);
        const query_search = request.input('query_search', '');
        const year = request.input('year', date.year());
        const month = request.input('month', date.month() + 1);
        const infoEntity = new InfoEntity(authentication);
        const filtros = { page, query_search, entity_id: entity.id, custom: {} };
        filtros.custom['YEAR(s.date)'] = year;
        filtros.custom['MONTH(s.date)'] = month;
        const { info, ballots } = await infoEntity.ballots(params.id, filtros);
        return {
            success: true,
            status: 200,
            info,
            ballots
        }
    }

    async permissions ({ params, request }) {
        const entity = request.$entity;
        let authentication = request.api_authentication;
        const page = request.input('page', 1);
        const query_search = request.input('query_search', '');
        const infoEntity = new InfoEntity(authentication);
        const filtros = { entity_id: entity.id };
        const datos = { page, query_search };
        const { info, permissions } = await infoEntity.permissions(params.id, datos, filtros);
        return {
            success: true,
            status: 200,
            info,
            permissions
        }
    }

    async licenses ({ params, request }) {
        const entity = request.$entity;
        let authentication = request.api_authentication;
        const page = request.input('page', 1);
        const query_search = request.input('query_search', '');
        const infoEntity = new InfoEntity(authentication);
        const filtros = { entity_id: entity.id };
        const datos = { page, query_search };
        const { info, licenses } = await infoEntity.licenses(params.id, datos, filtros);
        return {
            success: true,
            status: 200,
            info,
            licenses
        }
    }

    async ascents ({ params, request }) {
        const info = await Info.find(params.id);
        if (!info) throw new NotFoundModelException("el contrato")
        const page = request.input('page', 1);
        const perPage = request.input('perPage', 20)
        const query_search = request.input('query_search', '');
        let ascents = Ascent.query()
            .with('type_categoria')
            .where('info_id', info.id)
        if (query_search) ascents.where('description', 'like', `%${query_search}%`)
        ascents = await ascents.paginate(page, perPage)
        return {
            success: true, 
            status: 200,
            ascents
        }
    }

    async displacements ({ params, request }) {
        const authentication = request.api_authentication
        const info = await Info.find(params.id);
        if (!info) throw new NotFoundModelException("el contrato")
        const page = request.input('page', 1);
        const perPage = request.input('perPage', 20)
        const query_search = request.input('query_search', '');
        let displacements = Displacement.query()
            .where('info_id', info.id)
        if (query_search) displacements.where('resolution', 'like', `%${query_search}%`)
        displacements = await displacements.paginate(page, perPage)
        displacements = await displacements.toJSON()
        // obtener dependencias
        let dependenciaIds = collect(displacements.data || []).pluck('dependencia_id').toArray();
        let dependencias = await authentication.get(`dependencia?ids[]=${dependenciaIds.join('ids[]=')}`)
        .then(({ data }) => data.dependencia && data.dependencia.data || [])
        .catch(() => ([]))
        dependencias = collect(dependencias)
        // obtener perfil laboral
        let perfilIds = collect(displacements.data || []).pluck('perfil_laboral_id').toArray();
        let perfil_laborals = await authentication.get(`perfil_laboral?ids[]=${perfilIds.join('ids[]=')}`)
        .then(({ data }) => data.perfil_laboral && data.perfil_laboral.data || [])
        .catch(() => ([]))
        perfil_laborals = collect(perfil_laborals)
        // settinf data
        await displacements.data.map(d => {
            d.dependencia = dependencias.where('id', d.dependencia_id).first() || {}
            d.perfil_laboral = perfil_laborals.where('id', d.perfil_laboral_id).first() || {}
            return d 
        })
        // response
        return {
            success: true, 
            status: 200,
            displacements
        }
    }

    async merits ({ params, request }) {
        const info = await Info.find(params.id);
        if (!info) throw new NotFoundModelException("el contrato")
        const page = request.input('page', 1);
        const perPage = request.input('perPage', 20)
        const query_search = request.input('query_search', '');
        let merits = Merit.query()
            .where('info_id', info.id)
        if (query_search) merits.where('title', 'like', `%${query_search}%`)
        merits = await merits.paginate(page, perPage)
        return {
            success: true, 
            status: 200,
            merits
        }
    }
}   

module.exports = InfoController
