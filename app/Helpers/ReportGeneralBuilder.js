'use static';

const View = use('View');
const { default: collect } = require('collect.js');
const htmlToPdf = require('html-pdf-node');
const Work = use('App/Models/Work');

class ReportGeneralBuilder {

    filters = {
        entity_id: "",
        cargo_id: "",
        type_categoria_id: ""
    }

    options = {
        format: 'A4'
    }

    works = []

    constructor(authentication = {}, filters = this.filters) {
        this.authentication = authentication;
        this.filters = Object.assign(this.filters, filters);
        this.people = collect([]);
    }

    async getWorks() {
        let works = Work.query()
            .join('infos as i', 'i.work_id', 'works.id')
            .where('i.estado', 1)
        // filtros
        for(let attr in this.filters) {
            let value = this.filters[attr];
            if (!value) continue;
            works.where(`i.${attr}`, value);
        }
        // obtener
        works.select('works.*')
        works = await works.fetch();
        this.works = works.toJSON();
    }

    async getPeople(page = 1, ids = []) {
        let datos = await this.authentication.get(`person?page=${page}&ids=${ids.join('&ids=')}&perPage=100`)
        .then(res => {
            let { people } = res.data
            return { ...people, success: true }
        })
        .catch(() => ({ success: false }))
        if (!datos.success) return;
        // guardar datos
        await this.people.push(...datos.data);
        // siguiente carga
        let nextPage = page + 1;
        if (datos.lastPage >= nextPage) await this.getPeople(nextPage);
    }

    async stepPeople() {
        let idPlucked = collect(this.works).pluck('person_id');
        let idChunk = idPlucked.chunk(100);
        for (let ids of idChunk) {
            await this.getPeople(1, ids.toArray())
        }
    }

    async settingWorks() {
        for(let work of this.works) {
            work.person = await this.people.where('id', work.person_id).first() || {}
        }
    }

    dataRender() {
        return {
            works: this.works,
        }
    }

    async render() {
        // obtener works
        await this.getWorks();
        // obtener people
        await this.stepPeople();
        // setting works
        await this.settingWorks();
        // render
        const datos = this.dataRender();
        const html = View.render('report/general', datos);
        const file = { content: html }
        return await htmlToPdf.generatePdf(file, this.options);
    }

}

module.exports = ReportGeneralBuilder;