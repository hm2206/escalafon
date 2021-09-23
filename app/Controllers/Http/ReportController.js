'use strict'

const ReportBallotBuilder = require('../../Helpers/ReportBallotBuilder');
const ReportGeneralBuilder = require('../../Helpers/ReportGeneralBuilder');
const moment = require('moment');

class ReportController {

    async general({ request, response }) {
        let type = request.input('type', 'pdf');
        let filters = request.only(['cargo_id', 'type_categoria_id']);
        let authentication = request.api_authentication;
        const reportGeneralBuilder =  new ReportGeneralBuilder(authentication, filters, type);
        const builder = await reportGeneralBuilder.render();
        response.type(builder.header);
        return response.send(builder.result);
    }

    async ballots({ request, response }) {
        let type = request.input('type', 'pdf');
        let filters = request.only(['cargo_id', 'type_categoria_id'])
        let currentDate = moment();
        let year = request.input('year', currentDate.year())
        let month = request.input('month', currentDate.month() + 1)
        let authentication = request.api_authentication;
        const reportBallotBuilder = new ReportBallotBuilder(authentication, year, month, filters, type);
        const builder = await reportBallotBuilder.render();
        response.type(builder.header);
        return response.send(builder.result);
    }

}

module.exports = ReportController
