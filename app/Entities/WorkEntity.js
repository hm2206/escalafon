'use strict';

const { validation } = require('validator-error-adonis');
const DBException = require('../Exceptions/DBException');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');
const CustomException = require('../Exceptions/CustomException');
const { collect } = require('collect.js');
const Work = use('App/Models/Work');

class WorkEntity {

    authentication = {};

    attributes = {
        person_id: "",
        banco_id: "",
        numero_de_cuenta: "",
        afp_id: "",
        numero_de_cussp: "",
        fecha_de_afiliacion: "",
        numero_de_essalud: "",
        prima_seguro: "",
        code: "",
        orden: "",
        estado: 1 
    }

    constructor(authentication) {
        this.authentication = authentication;
    }

    async index (page = 1, query_search = "", perPage = 20) {
        let works = Work.query();
        if (query_search) works.where('orden', 'like', `%${query_search}%`);
        works = await works.paginate(page, perPage);
        works = await works.toJSON();
        let plucked = collect(works.data).pluck('person_id').toArray();
        let { people } = await this.authentication.get(`person?page=1&ids=${plucked.join('&ids=')}`)
        .then(res => res.data)
        .catch(err => ({ success: false, people: {} }));
        people = collect(people.data || []);
        // setting data
        works.data.map(w => {
            w.person = people.where('id', w.person_id).first() || {};
            return w;
        });
        // response
        return works;
    }

    async store (datos = this.attributes) {
        await validation(null, datos, {
            person_id: "required",
            banco_id: "required",
            afp_id: "required",
            prima_seguro: "number",
            fecha_de_afiliacion: "dateFormat:YYYY-MM-DD"
        });
        // validar person_id
        let { success, person } = await this.authentication.get(`person/${datos.person_id}`)
            .then(res => res.data)
            .catch(err => ({ success: false, person: {} }));
        if (!success) throw new NotFoundModelException("La Persona");
        // validar work
        let is_work = await Work.query()
            .where('person_id', person.id)
            .getCount('id');
        if (is_work) throw new CustomException("El trabajador ya exíste!");
        // guardar
        try {
            const work = await Work.create({
                person_id: datos.person_id,
                banco_id: datos.banco_id,
                numero_de_cuenta: datos.numero_de_cuenta,
                afp_id: datos.afp_id,
                numero_de_cussp: datos.numero_de_cussp,
                fecha_de_afiliacion: datos.fecha_de_afiliacion,
                numero_de_essalud: datos.numero_de_essalud,
                prima_seguro: datos.prima_seguro ? 1 : 0,
                code: datos.code,
                orden: datos.orden,
                estado: 0
            });
            // response
            work.person = person;
            return work;
        } catch (error) {
            throw new DBException(error, "regístro");
        }
    }

    async show (id) {
        let work = await Work.find(id || '__error');
        if (!work) throw new NotFoundModelException("El trabajador");
        let { person } = await this.authentication.get(`person/${work.person_id}`)
        .then(res => res.data)
        .catch(err => ({ success: true, person: {} }));
        work.person = person;
        return work;
    }

    async update (id, datos = this.attributes) {
        let work = await this.show(id);
        await validation(null, datos, {
            banco_id: "required",
            afp_id: "required",
            fecha_de_afiliacion: "dateFormat:YYYY-MM-DD"
        });
        // procesar
        try {
            // preparar datos
            let payload = {
                banco_id: datos.banco_id,
                numero_de_cuenta: datos.numero_de_cuenta,
                afp_id: datos.afp_id,
                numero_de_cussp: datos.numero_de_cussp,
                fecha_de_afiliacion: datos.fecha_de_afiliacion,
                numero_de_essalud: datos.numero_de_essalud,
                prima_seguro: datos.prima_seguro ? 1 : 0
            };
            // guardar datos
            await Work.query()
                .where('id', work.id)
                .update(payload);
            work = work.toJSON();
            work = { ...work, ...payload };
            // response
            return work
        } catch (error) {
            throw new DBException("regístro");
        }
    }

}


module.exports = WorkEntity;