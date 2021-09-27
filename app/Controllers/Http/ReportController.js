'use strict'

const ReportBallotBuilder = require('../../Helpers/ReportBallotBuilder');
const ReportGeneralBuilder = require('../../Helpers/ReportGeneralBuilder');
const ReportLicenseBuilder = require('../../Helpers/ReportLicenseBuilder');
const ReportVacationBuilder = require('../../Helpers/ReportVacationBuilder');
const moment = require('moment');

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

    async ballots({ request, response }) {
        let type = request.input('type', 'pdf');
        let entity = request.$entity;
        let filters = request.only(['cargo_id', 'type_categoria_id'])
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

}

module.exports = ReportController
