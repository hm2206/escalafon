'use strict';

const moment = require('moment');
const kue = use('Kue');
const ProcessDiscounts = use('App/Jobs/ProcessDiscounts');
const CustomException = require('../Exceptions/CustomException');
const Redis = use('Redis');
const DiscountBuilder = require('../Helpers/DiscountBuilder');

class DiscountEntity {

    constructor(request = null) {
        if (request) {
            this.auth = request.$auth;
            this.app = request.$app;
            this.method = request.$method;
        }
    }

    async preView(entity_id, year, month) {
        const discountBuilder = new DiscountBuilder(entity_id, year, month);
        return await discountBuilder.handle();
    }

    async process(entity, year, month) {
        let params_date = moment(`${year}-${month}`, 'YYYY-MM');
        let current_date = moment(moment().format('YYYY-MM'));
        let diff = current_date.diff(params_date, 'months').valueOf();
        // validar fecha
        if (diff != 1) throw new CustomException("Solo se puede procesar de un mes anterior");
        let keyRedis = `currentProcess:${entity.id}`;
        let currentProcess = await Redis.get(keyRedis);
        if (currentProcess == 1) throw new CustomException("Aún se está procesando el descuento en cola");
        const priority = 'normal';
        const attempts = 2;
        const remove = true;
        const jobFn = job => job.backoff();
        // poner en cola
        try {
            kue.dispatch(ProcessDiscounts.key, { 
                entity: entity,
                auth: this.auth,
                app: this.app,
                method: this.method,
                year,
                month,
                keyRedis,
            }, 
            { priority, attempts, remove, jobFn });
            // guardar proceso
            await Redis.set(keyRedis, 1);
        } catch (error) {
            await Redis.set(keyRedis, 0);
        }
    }

}

module.exports = DiscountEntity;