'use strict';

const PermissionEntity = require('../../Entities/PermissionEntity');
const NotFoundModelException = require('../../Exceptions/NotFoundModelException');
const Info = use('App/Models/Info');

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
        const entity = request.$entity;
        const permissionEntity = new PermissionEntity();
        const info = await Info.query()
            .join('permissions as p', 'p.info_id', 'infos.id')
            .where('p.id', params.id)
            .where('infos.entity_id', entity.id)
            .select('infos.*')
            .first();
        if (!info) throw new NotFoundModelException("El contrato"); 
        const datos = request.all();
        datos.info_id = info.id;
        const permission = await permissionEntity.update(params.id, datos);
        return {
            success: true,
            status: 200,
            message: "Los cambios se guardaron correctamente!",
            permission
        }
    }

    async delete({ params, request }) {
        const entity = request.$entity;
        const permissionEntity = new PermissionEntity();
        const info = await Info.query()
            .join('permissions as p', 'p.info_id', 'infos.id')
            .where('p.id', params.id)
            .where('infos.entity_id', entity.id)
            .select('infos.*')
            .first();
        if (!info) throw new NotFoundModelException("El contrato"); 
        const datos = request.all();
        datos.info_id = info.id;
        await permissionEntity.delete(params.id);
        return {
            success: true,
            status: 200,
            message: "El permiso se elimino correctamente!"
        }
    }

}

module.exports = PermissionController
