'use strict';

const TypePermissionEntity = require('../../Entities/TypePermissionEntity');

class TypePermissionController {

    async index({ request }) {
        const entity = request.$entity;
        const page = request.input('page', 1);
        const query_search = request.input('query_search', '');
        const typePermissionEntity = new TypePermissionEntity();
        const type_permissions = await typePermissionEntity.index({ page, query_search, custom: { entity_id: entity.id } });
        return { 
            success: true,
            status: 200,
            type_permissions,
        }
    }

    async store({ request }) {
        const entity = request.$entity;
        const datos = request.all();
        datos.entity_id = entity.id;
        const typePermissionEntity = new TypePermissionEntity();
        const type_permission = await typePermissionEntity.store(datos);
        return { 
            success: true,
            status: 200,
            type_permission,
        }
    }

    async update({ params, request }) {
        const entity = request.$entity;
        const datos = request.all();
        datos.entity_id = entity.id;
        const typePermissionEntity = new TypePermissionEntity();
        const type_permission = await typePermissionEntity.update(params.id, datos);
        return { 
            success: true,
            status: 200,
            type_permission,
        }
    }

}

module.exports = TypePermissionController
