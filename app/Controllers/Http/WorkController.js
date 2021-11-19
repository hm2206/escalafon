'use strict';

const { default: collect } = require('collect.js');
const WorkEntity = require('../../Entities/WorkEntity');
const NotFoundModelException = require('../../Exceptions/NotFoundModelException');
const Degree = use('App/Models/Degree')
const Work = use('App/Models/Work')

class WorkController {

    async index ({ request }) {
        let { page, query_search } = request.all();
        let entity = request.$entity;
        let cargo_id = request.input('cargo_id', '');
        let authentication = request.api_authentication;
        const workEntity = new WorkEntity(authentication);
        const works = await workEntity.index(page || 1, query_search || "", {}, entity.id, cargo_id);
        return {
            success: true,
            status: 201,
            works
        }
    }

    async store ({ request }) {
        let authentication = request.api_authentication;
        let datos = request.all();
        const workEntity = new WorkEntity(authentication);
        let work = await workEntity.store(datos);
        // response
        return {
            success: true,
            status: 201,
            message: "El trabajador se creó correctamente!",
            work
        }
    }  
    
    async show ({ params, request }) {
        let authentication = request.api_authentication;
        const workEntity = new WorkEntity(authentication);
        const work = await workEntity.show(params.id);
        // response
        return {
            success: true,
            status: 200,
            work
        }
    }

    async update ({ params, request }) {
        let authentication = request.api_authentication;
        const workEntity = new WorkEntity(authentication);
        const work = await workEntity.update(params.id, request.all());
        return {
            success: true,
            status: 201,
            message: "Los cambios se guardarón correctamente!",
            work
        };
    }

    async ficha ({ params, request, response }) {
        let authentication = request.api_authentication;
        let filters = collect(request.collect(['filters'])).pluck('filters').toArray()
        const workEntity = new WorkEntity(authentication);
        const ficha = await workEntity.ficha(params.id, filters);
        console.log(filters)
        response.header('Content-Type', 'application/pdf');
        return response.send(ficha);
    }

    async infos ({ params, request }) {
        let page = request.input('page', 1);
        let estados = collect(request.collect(['estado'])).pluck('estado').toArray();
        let principal = request.input('principal', null)
        let authentication = request.api_authentication;
        const workEntity = new WorkEntity(authentication);
        const { infos } = await workEntity.infos(params.id, { page, principal, custom: { estado: estados } });
        return {
            success: true,
            status: 201,
            infos
        };
    }

    async degrees ({ params, request }) {
        let work = await Work.find(params.id)
        if (!work) throw new NotFoundModelException("El trabajador")
        let page = request.input('page', 1)
        let perPage = request.input('perPage', 20)
        let query_search = request.input('query_search', '') 
        let degrees = Degree.query()
            .with('type_degree')
            .where('work_id', work.id)
        if (query_search) degrees.where('document_number', 'like', `%${degrees}%`)
        degrees = await degrees.paginate(page, perPage)
        return {
            success: true,
            status: 200,
            degrees
        };
    }

    async config_vacations ({ params, request }) {
        let authentication = request.api_authentication;
        let entity = request.$entity;
        const page = request.input('page', 1);
        const workEntity = new WorkEntity(authentication);
        let filtros = { page, custom: { entity_id: entity.id } }
        const { work, config_vacations } = await workEntity.config_vacations(params.id, {}, filtros);
        return {
            success: true,
            status: 200,
            work,
            config_vacations
        }
    }

    async reportVacations({ params, request, response }) {
        let entity = request.$entity;
        let type = request.input('type', 'pdf');
        let authentication = request.api_authentication;
        const workEntity = new WorkEntity(authentication);
        const builder = await workEntity.reportVacations(params.id, entity, type);
        response.type(builder.header);
        return response.send(builder.result);
    }

}

module.exports = WorkController
