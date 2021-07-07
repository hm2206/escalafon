'use strict'

const Info = use('App/Models/Info');
const ConfigVacationEntity = require('../../Entities/ConfigVacationEntity');
const { validation } = require('validator-error-adonis');

class ConfigVacationController {

    async store({ request, }) {
        let entity = request.$entity;
        let datos = request.all();
        await validation(null, datos, { info_id: 'required' });
        let configVacationEntity = new ConfigVacationEntity();
        let info_id = request.input('info_id', '__error');
        let info = await Info.query()
            .where('entity_id', entity.id)
            .where('id', info_id)
            .first() || {}
        // crear config_vacation
        const config_vacation = await configVacationEntity.store(info, datos);
        return { 
            success: true,
            status: 201,
            message: "La configuración de vacación anual se guardó correctamente",
            config_vacation
        }
    }

    async update({ params, request }) {
        let datos = request.all();
        let configVacationEntity = new ConfigVacationEntity();
        const config_vacation = await configVacationEntity.update(params.id, datos);
        return {
            success: true,
            status: 201,
            message: "los cambios se guardarón correctamente!",
            config_vacation
        }
    }

    async delete({ params }) {
        let configVacationEntity = new ConfigVacationEntity();
        await configVacationEntity.delete(params.id);
        return {
            success: true,
            status: 201,
            message: "La configuración se eliminó correctamente!"
        }
    }

}

module.exports = ConfigVacationController
