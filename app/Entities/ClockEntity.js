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
        this.auth = request.$auth;
        this.system = request.$system;
        this.app = request.$app
        this.method = request.$method;
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

    async syncAssistances (id, entity_id) {
        const priority = 'normal';
        const attempts = 2;
        const remove = true;
        const jobFn = job => job.backoff();
        let clock = await Clock.query()
            .where('entity_id', entity_id)
            .where('id', id)
            .first();
        if (!clock) throw new NotFoundModelException("El reloj");
        // poner en cola
        kue.dispatch(SyncClock.key, { 
            clocks: [clock],
            auth: this.auth,
            app: this.app,
            method: this.method,
        }, 
        { priority, attempts, remove, jobFn });
    }
}

module.exports = ClockEntity;