'use strict';

const { default: collect } = require('collect.js');
const WorkEntity = require('../../Entities/WorkEntity');

class WorkController {

    async index ({ request }) {
        let { page, query_search } = request.all();
        let entity = request.$entity;
        let authentication = request.api_authentication;
        const workEntity = new WorkEntity(authentication);
        const works = await workEntity.index(page || 1, query_search || "", {}, entity.id);
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
        const workEntity = new WorkEntity(authentication);
        const ficha = await workEntity.ficha(params.id);
        response.header('Content-Type', 'application/pdf');
        return response.send(ficha);
    }

    async infos ({ params, request, response }) {
        let page = request.input('page', 1);
        let estados = collect(request.collect(['estado'])).pluck('estado').toArray();
        let authentication = request.api_authentication;
        const workEntity = new WorkEntity(authentication);
        const { infos } = await workEntity.infos(params.id, { page, custom: { estado: estados } });
        return {
            success: true,
            status: 201,
            infos
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

}

module.exports = WorkController
