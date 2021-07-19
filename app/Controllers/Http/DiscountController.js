'use strict';

const DiscountEntity = require('../../Entities/DiscountEntity');

class DiscountController {

    async preView({ params, request }) {
        let year = params.year;
        let month = params.month;
        let entity = request.$entity;
        const discountEntity = new DiscountEntity();
        const discounts = await discountEntity.preView(entity.id, year, month);
        return {  
            success: true,
            status: 200,
            discounts
        };
    }

    async process({ params, request }) {
        let year = params.year;
        let month = params.month;
        let entity = request.$entity;
        const discountEntity = new DiscountEntity();
        await discountEntity.process(entity, year, month);
        return {
            success: true,
            status: 201,
            message: "Los descuentos están siendo procesados en segundo plano"
        }
    }

}

module.exports = DiscountController
