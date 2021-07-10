'use strict';

const VacationEntity = require('../../Entities/VacationEntity');
const ConfigVacation = use('App/Models/ConfigVacation');
const { validation } = require('validator-error-adonis');

class VacationController {

    async store({ request }) {
        let datos = request.all();
        let entity = request.$entity;
        await validation(null, datos, { config_vacation_id: 'required' });
        const config_vacation = await ConfigVacation.query()
            .where('entity_id', entity.id)
            .where('id', datos.config_vacation_id)
            .first() || {}; 
        const vacationEntity = new VacationEntity();
        const vacation = await vacationEntity.store(config_vacation, datos);
        return {
            success: true,
            status: 201,
            message: "La vacación se guardo correctamente!",
            vacation
        }
    }

    async update({ params, request }) {
        let datos = request.all();
        const vacationEntity = new VacationEntity();
        const vacation = await vacationEntity.update(params.id, datos);
        return {
            success: true,
            status: 201,
            message: "Los cambios se guardarón correctamente!",
            vacation
        }
    }

    async delete({ params }) {
        const vacationEntity = new VacationEntity();
        await vacationEntity.delete(params.id);
        return {
            success: true,
            status: 201,
            message: "Los datos se eliminaron correctamente!",
        }
    }

}

module.exports = VacationController
