'use strict'

const BallotEntity = require('../../Entities/BallotEntity');

class BallotController {

    async store({ request }) {
        const entity = request.$entity;
        const datos = request.all();
        const ballotEntity = new BallotEntity();
        const ballot = await ballotEntity.store(datos, { "i.entity_id": entity.id });
        return {
            success: true,
            status: 201,
            message: "La papeleta se guardo correctamente!",
            ballot
        }
    }

    async update({ params, request }) {
        const entity = request.$entity;
        const datos = request.all();
        const ballotEntity = new BallotEntity();
        const ballot = await ballotEntity.update(params.id, datos, { "i.entity_id": entity.id });
        return {
            success: true,
            status: 201,
            message: "Los cambios se guardo correctamente!",
            ballot
        }
    }

    async delete({ params }) {
        const ballotEntity = new BallotEntity();
        await ballotEntity.delete(params.id);
        return {
            success: true,
            status:201,
            message: "La papeleta se eliminó correctamente!!!"
        }
    }

}

module.exports = BallotController
