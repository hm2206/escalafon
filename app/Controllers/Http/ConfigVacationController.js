'use strict'

const Work = use('App/Models/Work');
const ConfigVacationEntity = require('../../Entities/ConfigVacationEntity');
const { validation } = require('validator-error-adonis');

class ConfigVacationController {

    async store({ request, }) {
        let entity = request.$entity;
        let datos = request.all();
        datos.entity_id = entity.id;
        await validation(null, datos, { work_id: 'required' });
        let configVacationEntity = new ConfigVacationEntity();
        let work_id = request.input('work_id', '__error');
        let work = await Work.query()
            .join('infos as i', 'i.work_id', 'works.id')
            .where('works.id', work_id)
            .where('i.entity_id', entity.id)
            .first() || {}
        // crear config_vacation
        const config_vacation = await configVacationEntity.store(work, datos);
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

    async vacations({ params, request }) {
        let page = request.input('page', 1);
        let configVacationEntity = new ConfigVacationEntity();
        const { config_vacation, vacations } = await configVacationEntity.vacations(params.id, { page });
        return {
            success: true,
            status: 200,
            config_vacation,
            vacations
        }
    }

}

module.exports = ConfigVacationController
