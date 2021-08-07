'use strict';

const DiscountEntity = require('../../Entities/DiscountEntity');
const CustomException = require('../../Exceptions/CustomException');
const DB = use('Database')
const Discount = use('App/Models/Discount');
const NotFoundModelException = require('../../Exceptions/NotFoundModelException')
const CalcDiscountProcedure = require('../../Procedures/CalcDiscountProcedure')

class DiscountController {

    async preView({ params, request }) {
        let year = params.year;
        let month = params.month;
        let entity = request.$entity;
        let page = request.input('page', 1);
        let query_search = request.input('query_search', '');
        let type_categoria_id = request.input('type_categoria_id', '')
        const discountEntity = new DiscountEntity(request);
        const discounts = await discountEntity.preView(entity.id, year, month, { page, query_search, type_categoria_id });
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
        const discountEntity = new DiscountEntity(request);
        const details = await discountEntity.preViewDetails(entity.id, year, month, type_categoria_id);
        return {
            success: true,
            status: 200,
            details
        }
    }

    async process({ params, request }) {
        let year = params.year;
        let month = params.month;
        let entity = request.$entity;
        const discountEntity = new DiscountEntity();
        await discountEntity.process(entity.id, year, month);
        return {
            success: true,
            status: 201,
            message: "Los descuentos se procesarón correctamente!"
        }
    }

}

module.exports = DiscountController
