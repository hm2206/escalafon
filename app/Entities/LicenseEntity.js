'use strict';

const { validation, ValidatorError } = require('validator-error-adonis');
const Info = use('App/Models/Info');
const License = use('App/Models/License');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');
const CustomException = require('../Exceptions/CustomException');
const moment = require('moment');
const DB = use('Database');

class LicenseEntity {

    attributes = {
        info_id: "",
        situacion_laboral_id: "",
        resolution: "",
        date_resolution: "",
        date_start: "",
        date_over: "",
        description: "",
        is_pay: 0,
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
        let licenses = License.query()
            .orderBy('date_over', 'DESC')
            .with('situacion_laboral')
        // query_search
        if (datos.query_search) licenses.where('resolution', 'like', `%${datos.query_search}%`) 
        // filtros avanzados
        licenses = this.handleFilters(licenses, datos.custom);
        // obtener datos
        licenses = datos.perPage ? await licenses.paginate(datos.page, datos.perPage) : await licenses.fetch();
        licenses = await licenses.toJSON();
        return licenses;
    }

    async store(tmpDatos = this.attributes, filtros = {}) {
        let datos = Object.assign(this.attributes, tmpDatos);
        await validation(null, datos, {
            info_id: "required",
            situacion_laboral_id: "required",
            resolution: "required",
            date_resolution: "required|dateFormat:YYYY-MM-DD",
            date_start: "required|dateFormat:YYYY-MM-DD",
            date_over: "required|dateFormat:YYYY-MM-DD",
            description: "required|max:255"
        });
        // obtener info
        let info = Info.query()
            .where('id', datos.info_id)
        info = this.handleFilters(info, filtros)
        info = await info.first();
        if (!info) throw new NotFoundModelException("El Contrato");
        // validar fecha
        let date_start = moment(datos.date_start);
        let date_over = moment(datos.date_over);
        let duration = date_over.diff(date_start, 'days').valueOf() + 1;
        if (duration <= 0) throw new ValidatorError([{ field: 'date_over', message: `La fecha termino debe ser mayor/igual a ${datos.date_start}` }]);
        // procesar dato
        try {
            let license = await License.create({
                info_id: datos.info_id,
                situacion_laboral_id: datos.situacion_laboral_id,
                resolution: datos.resolution,
                date_resolution: datos.date_resolution,
                date_start: datos.date_start,
                date_over: datos.date_over,
                description: datos.description,
                is_pay: datos.is_pay ? 1 : 0
            });
            // response
            return license;
        } catch (error) {
            throw new CustomException("No se pudó guardar los datos");
        }
    }

    async update(id, tmpDatos = this.attributes, filtros = {}) {
        let datos = Object.assign(this.attributes, tmpDatos);
        await validation(null, datos, {
            situacion_laboral_id: "required",
            resolution: "required",
            date_resolution: "required|dateFormat:YYYY-MM-DD",
            date_start: "required|dateFormat:YYYY-MM-DD",
            date_over: "required|dateFormat:YYYY-MM-DD",
            description: "required|max:255"
        });
        // preparar license
        let license = License.query()
            .with('situacion_laboral')
            .where('id', id);
        // filtros avanzados
        license = this.handleFilters(license, filtros);
        // obtener license
        license = await license.first();
        if (!license) throw new NotFoundModelException("La licencia")
        // validar fecha
        let date_start = moment(datos.date_start);
        let date_over = moment(datos.date_over);
        let duration = date_over.diff(date_start, 'days').valueOf() + 1;
        if (duration <= 0) throw new ValidatorError([{ field: 'date_over', message: `La fecha termino debe ser mayor/igual a ${datos.date_start}` }]);
        // procesar dato
        try {
            license.merge({
                situacion_laboral_id: datos.situacion_laboral_id,
                resolution: datos.resolution,
                date_resolution: datos.date_resolution,
                date_start: datos.date_start,
                date_over: datos.date_over,
                description: datos.description,
                is_pay: datos.is_pay ? 1: 0
            });
            // save
            await license.save();
            // response
            return license;
        } catch (error) {
            throw new CustomException("No se pudó guardar los cambios");
        }
    }

    async delete(id, filtros = {}) {
        // preparar license
        let license = License.query()
            .with('situacion_laboral')
            .where('id', id);
        // filtros avanzados
        license = this.handleFilters(license, filtros);
        // obtener license
        license = await license.first();
        if (!license) throw new NotFoundModelException("La licencia")
        // procesar
        try {
            return await license.delete();
        } catch (error) {
            throw new CustomException("No se pudó eliminar la licencia")
        }
    }

}

module.exports = LicenseEntity;