'use strict';

const TypePermission = use('App/Models/TypePermission');
const Permission = use('App/Models/Permission');
const Info = use('App/Models/Info');
const Work = use('App/Models/Work');
const DB = use('Database');
const CustomException = require('../Exceptions/CustomException');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');
const { validation, ValidatorError } = require('validator-error-adonis');
const moment = require('moment');

class PermissionEntity {

    attributes = {
        type_permission_id: "",
        info_id: "",
        date_start: "",
        date_over: "",
        days_used: 0,
        option: "",
        document_number: "",
        justification: "",
        state: 1
    }

    optionsEnum = []; 

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
        let permissions = Permission.query()
            .with('type_permission')
        // query_search
        if (datos.query_search) permissions.where('description', 'like', `%${datos.query_search}%`);
        // filtros avanzados
        for(let attr in datos.custom) {
            let value = datos.custom[attr];
            if (Array.isArray(value)) permissions.whereIn(DB.raw(attr), value);
            else if (typeof value != 'undefined' && value !== '' && value !== null) permissions.where(DB.raw(attr), value);
        }
        // obtener datos
        permissions = datos.perPage ? await permissions.paginate(datos.page, datos.perPage) : await permissions.fetch();
        // response
        return permissions;
    }

    async store(tmpDatos = this.attributes, filtros = {}) {
        let datos = Object.assign(this.attributes, tmpDatos);
        await validation(null, datos, {
            type_permission_id: 'required',
            info_id: 'required',
            date_start: 'required|dateFormat:YYYY-MM-DD',
            date_over: 'required|dateFormat:YYYY-MM-DD',
            option: 'required',
            document_number: 'required|max:100',
            justification: 'required|max:1000'
        })
        // obtener type_permisos
        let type_permission = await TypePermission.first(datos.type_permission_id);
        if (!type_permission) throw new NotFoundModelException("El tipo de permiso");
        let info = Info.query()
            .where('id', datos.info_id);
        // filtros info
        info = this.handleFilters(info, filtros);
        // obtener info
        info = await info.first();
        if (!info) throw new NotFoundModelException("El contrato");
        // moment dates
        let date_start = moment(datos.date_start);
        let date_over = moment(datos.date_over);
        let duration = date_over.diff(date_start, 'days') + 1;
        if (!duration) throw new ValidatorError([{ field: 'date_over', message: `La fecha de fin debe ser mayor/igual a ${datos.date_over}` }]);
        // validar datos
        if (type_permission.day_of_year) {
            let [{count_permissions}] = await Permission.query() 
            .where('type_permission_id', type_permission.id)
            .where('info_id', info.id)
            .sum('days_used as count_permissions');
            count_permissions = count_permissions || 0;
            let schedule_days = type_permission.day_of_year - count_permissions;
            let days_used = type_permission.day_of_year - (duration + count_permissions) 
            if (days_used < 0) throw new CustomException(`Usted solo tiene ${schedule_days} días disponibles`)
        }
        // procesar
        try {
            // guardar
            let permission = await Permission.create({
                type_permission_id: datos.type_permission_id,
                info_id: datos.info_id,
                date_start: datos.date_start,
                date_over: datos.date_over,
                option: datos.option,
                document_number: datos.document_number,
                justification: datos.justification,
            });
            // setting
            permission.info = info;
            permission.type_permission;
            // response
            return permission;
        } catch (error) {
            throw new CustomException("No se pudó guardar los datos");
        }
    }

    async update(id, tmpDatos = this.attributes, filtros = {}) {
        let datos = Object.assign(this.attributes, tmpDatos);
        await validation(null, datos, {
            date_start: 'required|dateFormat:YYYY-MM-DD',
            date_over: 'required|dateFormat:YYYY-MM-DD',
            option: 'required',
            document_number: 'required|max:100',
            justification: 'required|max:1000'
        })
        // obtener permission
        let permission = Permission.query().where('id', id);
        // filtros
        permission = this.handleFilters(permission, filtros);
        // obtener
        permission = await permission.first();
        if (!permission) throw new NotFoundModelException("El permiso");
        let info = await permission.info().fetch();
        let type_permission = await permission.type_permission().fetch();
        // moment dates
        let date_start = moment(datos.date_start);
        let date_over = moment(datos.date_over);
        let duration = date_over.diff(date_start, 'days') + 1;
        if (!duration) throw new ValidatorError([{ field: 'date_over', message: `La fecha de fin debe ser mayor/igual a ${datos.date_over}` }]);
        // validar datos
        if (type_permission.day_of_year) {
            let [{count_permissions}] = await Permission.query() 
            .where('type_permission_id', type_permission.id)
            .where('info_id', info.id)
            .where('id', '<>', permission.id)
            .sum('days_used as count_permissions');
            count_permissions = count_permissions || 0;
            let schedule_days = type_permission.day_of_year - count_permissions;
            let days_used = type_permission.day_of_year - (duration + count_permissions) 
            if (days_used < 0) throw new CustomException(`Usted solo tiene ${schedule_days} días disponibles`)
        }
        // procesar
        try {
            // guardar
            permission.merge({
                date_start: datos.date_start,
                date_over: datos.date_over,
                option: datos.option,
                document_number: datos.document_number,
                justification: datos.justification
            });

            await permission.save();
            // setting
            permission.info = info;
            permission.type_permission = type_permission;
            // reponse
            return permission;
        } catch (error) {
            throw new CustomException("No se pudó guardar los datos");
        }
    }

    async delete(id, filtros = {}) {
        // obtener permission
        let permission = Permission.query().where('id', id);
        // filtros
        permission = this.handleFilters(permission, filtros);
        // obtener
        permission = await permission.first();
        if (!permission) throw new NotFoundModelException("El permiso");
        // eliminar
        try {
            return await permission.delete();
        } catch (error) {
            throw new CustomException("No se puede eliminar el permiso");
        }
    }

}

module.exports = PermissionEntity;