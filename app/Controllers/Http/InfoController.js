'use strict';

const InfoEntity = require('../../Entities/InfoEntity');

class InfoController {

    async index ({ request }) {
        let page = request.input('page', 1);
        let query_search = request.input('query_search', '');
        const entity = request.$entity;
        let filtros = request.only(['planilla_id', 'cargo_id', 'type_categoria_id', 'meta_id']);
        filtros.entity_id = entity.id;
        let authentication = request.api_authentication;
        const infoEntity = new InfoEntity(authentication);
        const infos = await infoEntity.index({ page, query_search, custom: filtros });
        return {
            success: true,
            status: 201,
            infos
        }
    }

    async store ({ request }) {
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
        const infoEntity = new InfoEntity(authentication);
        const info = await infoEntity.show(params.id, { entity_id: entity.id });
        return {
            success: true,
            status: 200,
            info
        }
    }

}   

module.exports = InfoController
