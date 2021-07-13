'use strict';

const TypePermission = use('App/Models/TypePermission');
const DB = use('Database');
const CustomException = require('../Exceptions/CustomException');
const { validation } = require('validator-error-adonis');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');

class TypePermissionEntity {

    attributes = {
        description: "",
        day_of_year: 0,
        state: 1
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

    async index(tmpDatos = this.schemaPaginate) {
        let datos = Object.assign(this.schemaPaginate, tmpDatos);
        let type_permission = TypePermission.query();
        // query_search
        if (datos.query_search) type_permission.where('description', 'like', `%${datos.query_search}%`);
        // filtros avanzados
        for(let attr in datos.custom) {
            let value = datos.custom[attr];
            if (Array.isArray(value)) type_permission.whereIn(DB.raw(attr), value);
            else if (typeof value != 'undefined' && value !== '' && value !== null) type_permission.where(DB.raw(attr), value);
        }
        // obtener datos
        type_permission = datos.perPage ? await type_permission.paginate(datos.page, datos.perPage) : await type_permission.fetch();
        // response
        return type_permission;
    }

    async store(tmpDatos = this.attributes) {
        let datos = Object.assign(this.attributes, tmpDatos);
        await validation(null, datos, {
            entity_id: 'required',
            description: 'required|max:255',
            day_of_year: 'required|number'
        })
        // procesar
        try {
            // guardar
            let type_permission = await TypePermission.create({
                entity_id: datos.entity_id,
                description: datos.description,
                day_of_year: datos.day_of_year
            });
            // response
            return type_permission;
        } catch (error) {
            throw new CustomException("No se pudó guardar los datos");
        }
    }

    async update(id, tmpDatos = this.attributes, filtros = {}) {
        let datos = Object.assign(this.attributes, tmpDatos);
        await validation(null, datos, {
            entity_id: 'required',
            description: 'required|max:255',
            day_of_year: 'required|number'
        })
        // obtener type_permission
        let type_permission = TypePermission.query().where('id', id);
        // filtros
        type_permission = this.handleFilters(type_permission, filtros);
        // obtener
        type_permission = await type_permission.first();
        if (!type_permission) throw new NotFoundModelException("El tipo de permiso")
        // procesar
        try {
            // guardar
            type_permission.merge({
                description: datos.description,
                day_of_year: datos.day_of_year
            });

            await type_permission.save();
            // response
            return type_permission;
        } catch (error) {
            throw new CustomException("No se pudó guardar los cambios");
        }
    }

}

module.exports = TypePermissionEntity;