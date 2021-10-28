'use strict'

const ReportBallotBuilder = require('../../Helpers/ReportBallotBuilder');
const ReportGeneralBuilder = require('../../Helpers/ReportGeneralBuilder');
const ReportLicenseBuilder = require('../../Helpers/ReportLicenseBuilder');
const ReportVacationBuilder = require('../../Helpers/ReportVacationBuilder');
const ReportDiscountBuilder = require('../../Helpers/ReportDiscountBuilder');
const ReportInfoBuilder = require('../../Helpers/ReportInfoBuilder');
const moment = require('moment');
const ReportOnomasticoBuilder = require('../../Helpers/ReportOnomasticoBuilder');

let currentDate = moment()

class ReportController {

    async general({ request, response }) {
        let type = request.input('type', 'pdf');
        let entity = request.$entity;
        let filters = request.only(['cargo_id', 'type_categoria_id'])
        filters.entity_id = entity.id;
        let authentication = request.api_authentication;
        const reportGeneralBuilder =  new ReportGeneralBuilder(authentication, filters, type);
        const builder = await reportGeneralBuilder.render();
        response.type(builder.header);
        return response.send(builder.result);
    }

    async onomastico({ request, response }) {
        let currentDate = moment();
        let month = request.input('month', currentDate.month() + 1);
        let type = request.input('type', 'pdf');
        let entity = request.$entity;
        let filters = request.only(['cargo_id', 'type_categoria_id'])
        filters.entity_id = entity.id;
        let authentication = request.api_authentication;
        const reportOnomasticoBuiler =  new ReportOnomasticoBuilder(authentication, filters, month, type);
        const builder = await reportOnomasticoBuiler.render();
        response.type(builder.header);
        return response.send(builder.result);
    }

    async ballots({ request, response }) {
        let type = request.input('type', 'pdf');
        let entity = request.$entity;
        let filters = request.only(['cargo_id', 'type_categoria_id', 'day'])
        filters.entity_id = entity.id;
        let currentDate = moment();
        let year = request.input('year', currentDate.year())
        let month = request.input('month', currentDate.month() + 1)
        let authentication = request.api_authentication;
        const reportBallotBuilder = new ReportBallotBuilder(authentication, year, month, filters, type);
        const builder = await reportBallotBuilder.render();
        response.type(builder.header);
        return response.send(builder.result);
    }

    async licenses({ request, response }) {
        let type = request.input('type', 'pdf');
        let entity = request.$entity;
        let filters = request.only(['cargo_id', 'type_categoria_id'])
        filters.entity_id = entity.id;
        let year = request.input('year', currentDate.year())
        let month = request.input('month', currentDate.month() + 1)
        let authentication = request.api_authentication;
        const reportLicenseBuilder = new ReportLicenseBuilder(authentication, year, month, filters, type);
        const builder = await reportLicenseBuilder.render();
        response.type(builder.header);
        return response.send(builder.result);
    }

    async vacations({ request, response }) {
        let type = request.input('type', 'pdf');
        let entity = request.$entity;
        let year = request.input('year', currentDate.year())
        let filters = request.only(['cargo_id', 'type_categoria_id'])
        filters.year = year;
        let authentication = request.api_authentication;
        const reportVacationBuilder = new ReportVacationBuilder(authentication, entity, filters, type);
        const builder = await reportVacationBuilder.render();
        response.type(builder.header);
        return response.send(builder.result);
    }

    async discounts({ request, response }) {
        let type = request.input('type', 'pdf');
        let entity = request.$entity;
        let year = request.input('year', currentDate.year())
        let month = request.input('month', currentDate.month() + 1)
        let filters = request.only(['cargo_id', 'type_categoria_id'])
        filters.entity_id = entity.id;
        filters.year = year;
        filters.month = month;
        let authentication = request.api_authentication;
        const reportDiscountBuilder = new ReportDiscountBuilder(authentication, filters, type);
        const builder = await reportDiscountBuilder.render();
        response.type(builder.header);
        return response.send(builder.result);
    }

    async infos({ request, response }) {
        let type = request.input('type', 'pdf');
        let entity = request.$entity;
        let year = request.input('year', currentDate.year())
        let month = request.input('month', currentDate.month() + 1)
        let filters = request.only(['cargo_id', 'type_categoria_id'])
        filters.entity_id = entity.id;
        filters.estado = request.input('estado');
        filters.year = year;
        filters.month = month;
        let authentication = request.api_authentication;
        const reportInfoBuilder = new ReportInfoBuilder(authentication, filters, type);
        const builder = await reportInfoBuilder.render();
        response.type(builder.header);
        return response.send(builder.result);
    }
 
}

module.exports = ReportController
