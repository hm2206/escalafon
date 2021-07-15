'use strict';

const LicenseEntity = require('../../Entities/LicenseEntity');

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
        const filtros = { entity_id: entity.id };
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
        const filtros = { entity_id: entity.id };
        const licenseEntity = new LicenseEntity();
        const license = await licenseEntity.delete(params.id, filtros);
        return {
            success: true,
            status: 200,
            message: "La licencia se eliminó correctamente!"
        }
    }

}

module.exports = LicenseController
