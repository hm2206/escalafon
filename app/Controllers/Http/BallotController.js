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

}

module.exports = BallotController
