'use strict';

const Work = use('App/Models/Work');
const DB = use('Database');
const collect = require('collect.js');

class EntityEntity {

    constructor(authentication = null) {
        if (authentication) this.authentication = authentication;
    }

    schemaPage = {
        page: 1,
        perPage: 20,
        query_search: "",
        custom: {}
    }

    async works (entity, data = this.schemaPage) {
        let attributes = [
            'works.id', 'works.person_id', 'works.banco_id', 'works.numero_de_cuenta', 'works.afp_id', 
            'works.numero_de_cussp', 'works.fecha_de_afiliacion', 'works.orden', 'works.estado',
            'works.fecha_de_ingreso', 'works.numero_de_essalud', 'works.prima_seguro', 
        ];
        let parseQuery = attributes.join(', ');
        // obtener works
        let works = Work.query()
            .join('infos as inf', 'inf.work_id', 'works.id')
            .where('inf.entity_id', entity.id)
            .orderBy('works.orden', 'ASC')
            .select(DB.raw(parseQuery))
            .groupBy(DB.raw(parseQuery));
        // query_search
        if (data.query_search) works.where('orden', 'like', `%${data.query_search}%`);
        // filtros
        for(let attr in data.custom) {
            let value = data.custom[attr];
            if (value) works.where(attr, value);
        }
        // paginar
        works = await works.paginate(data.page, data.perPage);
        works = await works.toJSON();
        // obtener person
        let plucked = collect(works.data).pluck('person_id').toArray();
        let { people } = await this.authentication.get(`person?page=1&ids=${plucked.join('&ids=')}`)
        .then(res => res.data)
        .catch(err => ({ people: {} }));
        people = collect(people.data || []);
        // setting data
        works.data.map(w => {
            w.person = people.where('id', w.person_id).first() || {};
            return w;
        });
        // response
        return works;
    }

}

module.exports = EntityEntity;