'use strict'

const ClockEntity = require('../../Entities/ClockEntity');

class ClockController {

    async index ({ request }) {
        let { page } = request.all();
        let clockEntity = new ClockEntity();
        let clocks = await clockEntity.getClocks(page || 1);
        // response
        return {
            success: true,
            status: 201,
            clocks
        }
    }

    async store ({ request }) {
        let entity = request.$entity;
        let payload = request.all();
        payload.entity_id = entity.id;
        // guardar datos
        let clockEntity = new ClockEntity();
        let clock = await clockEntity.store(payload);
        // response
        return {
            success: true,
            status: 201,
            message: "Los datos se guardarón correctamente!",
            clock
        }
    }

}

module.exports = ClockController
