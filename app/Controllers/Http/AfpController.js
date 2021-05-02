'use strict'

const AfpEntity = require('../../Entities/AfpEntity');

class AfpController {

    async index ({ request }) {
        let { page, query_search } = request.all();
        const afpEntity = new AfpEntity();
        const afps = await afpEntity.index(page || 1, query_search || "");
        // request
        return {
            success: true,
            status: 201,
            afps
        }
    }

}

module.exports = AfpController
