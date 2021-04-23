'use strict';

const Clock = use('App/Models/Clock');
const DBException = require('../Exceptions/DBException');
const { validation } = require('validator-error-adonis');
const { validateAll } = use('Validator');
const kue = use('Kue');
const SyncClock = use('App/Jobs/SyncClock');

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

    async syncClock (entity_id) {
        const priority = 'normal';
        const attempts = 2;
        const remove = true;
        const jobFn = job => job.backoff();
        const clocks = await Clock.query()
            .where('entity_id', entity_id)
            .fetch();
        clocks = await clocks.toJSON();
        // poner en cola
        kue.dispatch(SyncClock.key, { clocks }, { priority, attempts, remove, jobFn });
    }
}

module.exports = ClockEntity;