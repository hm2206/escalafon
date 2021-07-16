'use strict';

const LicenseEntity = require('../../Entities/LicenseEntity');
const Info = use('App/Models/Info');
const NotFoundModelException = require('../../Exceptions/NotFoundModelException');

class LicenseController {

    async store({ request }) {
        const entity = request.$entity;
        const datos = request.all();
        datos.entity_id = entity.id;
        const licenseEntity = new LicenseEntity();
        const license = await licenseEntity.store(datos);
        return {
            success: true,
            status: 200,
            message: "Los datos se guardarón correctamente!",
            license
        }
    }

    async update({ params, request }) {
        const entity = request.$entity;
        const datos = request.all();
        const info = await Info.query()
            .join('licenses as l', 'l.info_id', 'infos.id')
            .where('l.id', params.id)
            .where('infos.entity_id', entity.id)
            .select('infos.*')
            .first();
        if (!info) throw new NotFoundModelException("El contrato"); 
        const filtros = { info_id: info.id };
        const licenseEntity = new LicenseEntity();
        const license = await licenseEntity.update(params.id, datos, filtros);
        return {
            success: true,
            status: 200,
            message: "Los datos se guardarón correctamente!",
            license
        }
    }

    async delete({ params, request }) {
        const entity = request.$entity;
        const info = await Info.query()
            .join('licenses as l', 'l.info_id', 'infos.id')
            .where('l.id', params.id)
            .where('infos.entity_id', entity.id)
            .select('infos.*')
            .first();
        if (!info) throw new NotFoundModelException("El contrato"); 
        const filtros = { info_id: info.id };
        const licenseEntity = new LicenseEntity();
        await licenseEntity.delete(params.id, filtros);
        return {
            success: true,
            status: 200,
            message: "La licencia se eliminó correctamente!"
        }
    }

}

module.exports = LicenseController
