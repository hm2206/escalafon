'use strict';

const Clock = use('App/Models/Clock');
const DBException = require('../Exceptions/DBException');
const { validation } = require('validator-error-adonis');
const { validateAll } = use('Validator');
const kue = use('Kue');
const SyncClock = use('App/Jobs/SyncClock');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');

class ClockEntity {

    constructor (request) {
        if (request) {
            this.auth = request.$auth;
            this.system = request.$system;
            this.app = request.$app
            this.method = request.$method;
        }
    }

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

    async syncAssistances (id, entity_id, year, month) {
        const priority = 'normal';
        const attempts = 2;
        const remove = true;
        const jobFn = job => job.backoff();
        let clock = await Clock.query()
            .where('entity_id', entity_id)
            .where('id', id)
            .first();
        if (!clock) throw new NotFoundModelException("El reloj");
        if (clock.sync) throw new Error("El reloj está en medio de un proceso, vuelva más tarde!!!");
        // disabled sync
        clock.merge({ sync: 1 });
        await clock.save();
        // poner en cola
        kue.dispatch(SyncClock.key, { 
            clocks: [clock],
            auth: this.auth,
            app: this.app,
            method: this.method,
            year,
            month
        }, 
        { priority, attempts, remove, jobFn });
    }
}

module.exports = ClockEntity;