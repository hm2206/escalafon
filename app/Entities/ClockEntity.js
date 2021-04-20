'use strict';

const Clock = use('App/Models/Clock');
const DBException = require('../Exceptions/DBException');
const { validation } = require('validator-error-adonis');
const { validateAll } = use('Validator');

class ClockEntity {

    async getClocks (page = 1) {
        let clocks = Clock.query();
        // paginar
        return await clocks.paginate(page, 20);
    }

    async store (datos = {}) {
        await validation(validateAll, datos, {
            name: "required|unique:clocks",
            host: "required|ip",
            port: "required|integer",
            entity_id: "required"
        });
        // guardar datos
        try {
            return await Clock.create(datos);
        } catch (error) {
            throw new DBException(error);
        }
    }

}

module.exports = ClockEntity;