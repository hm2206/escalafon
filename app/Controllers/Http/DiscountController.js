'use strict';

const DiscountEntity = require('../../Entities/DiscountEntity');

class DiscountController {

    async preView({ params, request }) {
        let year = params.year;
        let month = params.month;
        let entity = request.$entity;
        let page = request.input('page', 1);
        let query_search = request.input('query_search', '');
        let cargo_id = request.input('cargo_id', '');
        let type_categoria_id = request.input('type_categoria_id', '')
        const discountEntity = new DiscountEntity(request);
        const discounts = await discountEntity.preView(entity.id, year, month, { page, query_search, cargo_id, type_categoria_id });
        return {  
            success: true,
            status: 200,
            discounts
        };
    }

    async preViewDetails({ params, request }) {
        let year = params.year;
        let month = params.month;
        let entity = request.$entity;
        let type_categoria_id = request.input('type_categoria_id', '')
        let cargo_id = request.input('cargo_id', '')
        let filtros = { type_categoria_id, cargo_id }
        const discountEntity = new DiscountEntity(request);
        const details = await discountEntity.preViewDetails(entity.id, year, month, filtros);
        return {
            success: true,
            status: 200,
            details
        }
    }

}

module.exports = DiscountController
