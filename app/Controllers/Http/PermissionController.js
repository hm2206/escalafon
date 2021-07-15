'use strict';

const PermissionEntity = require('../../Entities/PermissionEntity');

class PermissionController {

    async index({ request }) {
        const entity = request.$entity;
        const permissionEntity = new PermissionEntity();
        const type_permission_id = request.input('type_permission_id', '');
        const page = request.input('page', 1);
        const query_search = request.input('query_search', '');
        const custom = { type_permission_id: type_permission_id };
        const permissions = await permissionEntity.index(entity.id, { page, query_search, custom });
        return {
            success: true,
            status: 200,
            permissions
        }
    }

    async store({ request }) {
        const entity = request.$entity;
        const permissionEntity = new PermissionEntity();
        const datos = request.all();
        datos.entity_id = entity.id;
        const permission = await permissionEntity.store(datos);
        return {
            success: true,
            status: 200,
            message: "Los datos se guardaron correctamente!",
            permission
        }
    }

    async update({ params, request }) {
        const permissionEntity = new PermissionEntity();
        const datos = request.all();
        const permission = await permissionEntity.update(params.id, datos);
        return {
            success: true,
            status: 200,
            message: "Los cambios se guardaron correctamente!",
            permission
        }
    }

    async delete({ params }) {
        const permissionEntity = new PermissionEntity();
        const permission = await permissionEntity.delete(params.id);
        return {
            success: true,
            status: 200,
            message: "El permiso se elimino correctamente!"
        }
    }

}

module.exports = PermissionController
