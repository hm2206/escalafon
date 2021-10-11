'use strict'

const ConfigDiscount = use('App/Models/ConfigDiscount')
const moment = require('moment');
const { validation, ValidatorError } = require('validator-error-adonis')
const CustomException = require('../../Exceptions/CustomException')
const NotFoundModelException = require('../../Exceptions/NotFoundModelException')
const PreparateDiscountProcedure = require('../../Procedures/PrepareDiscountProcedure');
const CalcDiscountProcedure = require('../../Procedures/CalcDiscountProcedure');
const DiscountBuilder = require('../../Helpers/DiscountBuilder');
const DiscountDetailBuilder = require('../../Helpers/DiscountDetailBuilder');

class ConfigDiscountController {

    async index({ request }) {
        let entity = request.$entity;
        let page = request.input('page', 1);
        let perPage = request.input('perPage', 20);
        let query_search = request.input('query_search', '')
        let config_discounts = ConfigDiscount.query().where('entity_id', entity.id);
        if (query_search) config_discounts.where('year', query_search);
        config_discounts = await config_discounts.paginate(page, perPage);
        return { 
            success: true,
            status: 200,
            config_discounts
        }
    }

    async store({ request }) {
        let entity = request.$entity;
        let datos = request.all();
        await validation(null, datos, {
            month: 'required|number',
            observation: 'max:1000'
        });

        const current_date = moment();
        const current_date_params = moment(`${datos.year}-${datos.month}`, 'YYYY-MM');

        const diff = current_date.diff(current_date_params, 'months').valueOf();
        const year = current_date.year();
        const old_month = current_date.subtract(1, 'months');
        
        if (diff != 1) throw new ValidatorError([{ field: 'month', message: `Solo está permitido el mes de ${old_month.format('MMMM')}` }])

        try {
            const config_discount = await ConfigDiscount.create({
                entity_id: entity.id,
                year,
                month: datos.month,
                observation: datos.observation || null
            })
            // procesar discounts
            await PreparateDiscountProcedure.call({ config_discount_id: config_discount.id });
            await CalcDiscountProcedure.call({ config_discount_id: config_discount.id });
            // response
            return {
                success: true,
                status: 201,
                message: "Los datos se guardarón correctamente!",
                config_discount,
            }
        } catch (error) {
            throw new CustomException("No se pudo guardar los datos");
        }
    }

    async show({ params }) {
        let config_discount = await ConfigDiscount.find(params.id);
        if (!config_discount) throw new NotFoundModelException("La configuración de descuentos");
        return { 
            success: true,
            status: 201,
            config_discount
        }
    }

    async processDiscounts({ params }) {
        let config_discount = await ConfigDiscount.find(params.id);
        if (!config_discount) throw new NotFoundModelException("La configuración del descuento")
        let current_date_discount = moment(`${config_discount.year}-${config_discount.month}`, 'YYYY-MM');
        let current_date = moment(moment().format('YYYY-MM'));
        let diff = current_date.diff(current_date_discount, 'months').valueOf();
        // validar fecha
        if (diff != 1 && diff != 0) throw new CustomException("Solo se puede procesar de un mes anterior");
        // poner en cola
        try {
            await PreparateDiscountProcedure.call({ config_discount_id: config_discount.id });
            await CalcDiscountProcedure.call({ config_discount_id: config_discount.id });
            return {
                success: true,
                status: 201,
                message: "Los descuentos se procesaron correctamente!"
            }
        } catch (error) {
            throw new Error("No se pudó procesar los descuentos")
        }
    }

    async discounts({ params, request, response }) {
        let type = request.input('type', 'json');
        let authentication = request.api_authentication;
        let config_discount = await ConfigDiscount.find(params.id);
        if (!config_discount) throw new NotFoundModelException("La configuración de descuentos");
        let datos = request.only(['cargo_id', 'type_categoria_id']);
        datos.page = request.input('page', 1);
        datos.perPage = request.input('perPage', 100);
        const discountBuilder = new DiscountBuilder(authentication, config_discount, datos, type);
        const discounts = await discountBuilder.handle();
        if (type == 'json') return {
            success: true,
            status: 201,
            discounts
        }
        // blob
        response.type(discounts.mime);
        return response.send(discounts.result);
    }

    async headDiscounts({ params, request }) {
        let authentication = request.api_authentication;
        let config_discount = await ConfigDiscount.find(params.id);
        if (!config_discount) throw new NotFoundModelException("La configuración de descuentos");
        let datos = request.only(['cargo_id', 'type_categoria_id']);
        const discountDetailBuilder = new DiscountDetailBuilder(authentication, config_discount, datos);
        const details = await discountDetailBuilder.handle();
        return {
            success: true,
            status: 201,
            details
        }
    }

    async verified({ params }) {
        let config_discount = await ConfigDiscount.find(params.id);
        if (!config_discount) throw new NotFoundModelException("La configuración de descuentos");
        if (config_discount.status != 'START') throw new CustomException("No se puede verificar la configuración de descuentos")
        config_discount.merge({ status: 'VERIFIED' });
        await config_discount.save();
        return {
            success: true,
            status: 201,
            message: "La configuración de descuentos se verificarón correctamente!"
        }
    }

    async accepted({ params }) {
        let config_discount = await ConfigDiscount.find(params.id);
        if (!config_discount) throw new NotFoundModelException("La configuración de descuentos");
        if (config_discount.status != 'VERIFIED') throw new CustomException("No se puede aceptar la configuración de descuentos")
        config_discount.merge({ status: 'ACCEPTED' });
        await config_discount.save();
        return {
            success: true,
            status: 201,
            message: "La configuración de descuentos fué aceptada correctamente!"
        }
    }

}

module.exports = ConfigDiscountController
