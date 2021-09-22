'use strict'

const ReportGeneralBuilder = require('../../Helpers/ReportGeneralBuilder');

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

}

module.exports = ReportController
