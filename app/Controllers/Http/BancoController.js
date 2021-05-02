'use strict';

const BancoEntity = require('../../Entities/BancoEntity');

class BancoController {

    async index ({ request }) {
        let { page, query_search } = request.all();
        const bancoEntity = new BancoEntity();
        const bancos = await bancoEntity.index(page || 1, query_search || "");
        // response
        return {
            success: true,
            status: 200,
            bancos,
        };
    }

}

module.exports = BancoController
