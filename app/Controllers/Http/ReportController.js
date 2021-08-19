'use strict'

const ReportGeneralBuilder = require('../../Helpers/ReportGeneralBuilder');

class ReportController {

    async general({ request, response }) {
        let filters = request.only(['cargo_id', 'type_categoria_id']);
        let authentication = request.api_authentication;
        const reportGeneralBuilder =  new ReportGeneralBuilder(authentication, filters);
        const result = await reportGeneralBuilder.render();
        response.header('Content-Type', 'application/pdf')
        return response.send(result);
    }

}

module.exports = ReportController
