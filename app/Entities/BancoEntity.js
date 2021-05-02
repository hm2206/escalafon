'use strict';

const Banco = use('App/Models/Banco');
const DB = use('Database');

class BancoEntity {

    async index (page = 1, query_search = "", perPage = 20, order = 'ASC') {
        let bancos = Banco.query()
            .orderBy('id', order)
        // filtros
        if (query_search) bancos.where('nombre', 'like', `%${query_search}%`)
            .orWhere('descripcion', 'like', `%${query_search}%`);
        // paginar
        bancos = await bancos.paginate(page, perPage);
        return bancos; 
    }

}

module.exports = BancoEntity;