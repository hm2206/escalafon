'use strict';

const moment = require('moment');
const CustomException = require('../Exceptions/CustomException');
const DiscountBuilder = require('../Helpers/DiscountBuilder');
const DiscountDetailBuilder = require('../Helpers/DiscountDetailBuilder');
const PreparateDiscountProcedure = require('../Procedures/PrepareDiscountProcedure');
const CalcDiscountProcedure = require('../Procedures/CalcDiscountProcedure');

class DiscountEntity {

    constructor(request = null) {
        if (request) {
            this.authentication = request.api_authentication;
            this.auth = request.$auth;
            this.app = request.$app;
            this.method = request.$method;
        }
    }

    async preView(entity_id, year, month, datos = { page: 1, query_search: "" }) {
        const discountBuilder = new DiscountBuilder(this.authentication, entity_id, year, month, datos);
        return await discountBuilder.handle();
    }

    async preViewDetails(entity_id, year, month) {
        const discountDetailBuilder = new DiscountDetailBuilder(entity_id, year, month);
        return await discountDetailBuilder.handle();
    }

    async process(entity_id, year, month) {
        let params_date = moment(`${year}-${month}`, 'YYYY-MM');
        let current_date = moment(moment().format('YYYY-MM'));
        let diff = current_date.diff(params_date, 'months').valueOf();
        // validar fecha
        if (diff != 1 && diff != 0) throw new CustomException("Solo se puede procesar de un mes anterior");
        // poner en cola
        try {
            await PreparateDiscountProcedure.call({ entity_id, year, month });
            await CalcDiscountProcedure.call({ entity_id, year, month });
        } catch (error) {
            throw new Error("No se pudó procesar los descuentos")
        }
    }

}

module.exports = DiscountEntity;