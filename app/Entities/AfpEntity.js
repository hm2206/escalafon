'use strict';

const Afp = use('App/Models/Afp');
const DB = use('Database');

class AfpEntity {

    async index (page = 1, query_search = "", perPage = 20, order = 'ASC') {
        let afps = Afp.query()
            .orderBy('afp_id', order)
            .select('*', DB.raw(`CONCAT(afp, ' - ', type_afp) as description`));
        // filtros
        if (query_search) afps.where('afp', 'like', `%${query_search}%`)
            .orWhere('afp', 'like', `%${query_search}%`);
        // paginar
        afps = await afps.paginate(page, perPage);
        return afps; 
    }

}

module.exports = AfpEntity;