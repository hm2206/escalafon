'use static';

const { default: collect } = require('collect.js');
const moment = require('moment');
const DB = use('Database');
const Info = use('App/Models/Info');
const Vacation = use('App/Models/Vacation');
const License = use('App/Models/License');
const Permission = use('App/Models/Permission');
const Schedule = use('App/Models/Schedule');
const Assistance = use('App/Models/Assistance');
const Ballot = use('App/Models/Ballot');

class DiscountBuilder {

    infos = [];
    vacations = [];
    dates = [];
    body = [];
    people = [];

    dataPage = {
        page: 10,
        perPage: 20,
        query_search: "",
        type_categoria_id: "",
    }

    constructor(authentication, entity_id, year, month, tmpDatos = this.dataPage) {
        this.dataPage = Object.assign(this.dataPage, tmpDatos);
        this.authentication = authentication;
        this.entity_id = entity_id;
        this.year = year;
        this.month = month;
    }

    async getDates() {
        let dates = [];
        let texts =  {
            0: 'D',
            1: 'L',
            2: 'M',
            3: 'M',
            4: 'J',
            5: 'V',
            6: 'S'
        }
        let dateFormat = `${this.year}-${this.month}-01`;
        let date_over = moment(dateFormat, 'YYYY-MM-DD').add(1, 'months').subtract(1, 'days');
        let lastDay = date_over.format('D');
        for (let day = 1; day <= lastDay; day++) {
            let currentDateFormat = `${this.year}-${this.month}-${day}`;
            let currentDate = moment(currentDateFormat, 'YYYY-MM-DD');
            let currentIndex = currentDate.days();
            dates.push({
                date: currentDate.format('YYYY-MM-DD'),
                index: currentIndex,
                text: texts[currentIndex]
            });
        }
        // assign
        this.dates = dates;
    }

    async getInfos() {
        let infos = Info.query() 
            .with('work', build => build.select('works.id', 'works.person_id'))
            .with('type_categoria', build => build.select('type_categorias.id', 'type_categorias.descripcion'))
            .join('works as w', 'w.id', 'infos.work_id')
            .join('discounts as d', 'd.info_id', 'infos.id')
            .where('infos.entity_id', this.entity_id)
            .where('d.year', this.year)
            .where('d.month', this.month)
            .select(
                'infos.id', DB.raw('d.id as discount_id'), 'infos.work_id', 'infos.type_categoria_id', 
                'd.base', 'd.discount_min', 'd.discount', 'd.days'
            )
            .orderBy('w.orden', 'ASC')

        // filtrar
        if (this.dataPage.type_categoria_id) infos.where('infos.type_categoria_id', this.dataPage.type_categoria_id)
        // paginar
        infos = await infos.paginate(this.dataPage.page, this.dataPage.perPage);
        this.infos = await infos.toJSON();
    }

    async getPeople() {
        let personIds = collect(this.infos.data).pluck('work.person_id').toArray();
        let people = await this.authentication.get(`person?ids[]=${personIds.join('&ids[]=')}`)
        .then(res => res.data.people.data || [])
        .catch(() => ([]));
        this.people = collect(people);
    }

    async getVacationes() {
        let workIds = collect(this.infos.data).pluck('work_id').toArray();
        let vacations = await Vacation.query()
            .join('config_vacations as c', 'c.id', 'vacations.config_vacation_id')
            .where('c.entity_id', this.entity_id)
            .whereIn('c.work_id', workIds)
            .where(DB.raw(`( YEAR(vacations.date_start) <= ${this.year} AND YEAR(vacations.date_over) >= ${this.year} )`)) 
            .where(DB.raw(`( MONTH(vacations.date_start) <= ${this.month} AND MONTH(vacations.date_over) >= ${this.month} )`)) 
            .select('vacations.*', 'c.work_id')
            .fetch();
        // response
        this.vacations = collect(await vacations.toJSON());
    }

    async getLicenses() {
        let infoIds = collect(this.infos.data).pluck('id').toArray();
        let licenses = await License.query()
            .with('situacion_laboral')
            .whereIn('info_id', infoIds)
            .where(DB.raw(`( YEAR(licenses.date_start) <= ${this.year} AND YEAR(licenses.date_over) >= ${this.year} )`)) 
            .where(DB.raw(`( MONTH(licenses.date_start) <= ${this.month} AND MONTH(licenses.date_over) >= ${this.month} )`)) 
            .fetch();
        // response
        this.licenses = collect(await licenses.toJSON());
    }

    async getPermissions() {
        let infoIds = collect(this.infos.data).pluck('id').toArray();
        let permissions = await Permission.query()
            .with('type_permission')
            .whereIn('info_id', infoIds)
            .where(DB.raw(`( YEAR(permissions.date_start) <= ${this.year} AND YEAR(permissions.date_over) >= ${this.year} )`)) 
            .where(DB.raw(`( MONTH(permissions.date_start) <= ${this.month} AND MONTH(permissions.date_over) >= ${this.month} )`)) 
            .fetch();
        // response
        this.permissions = collect(await permissions.toJSON());
    }

    async getSchedules() {
        let infoIds = collect(this.infos.data).pluck('id').toArray();
        let schedules = await Schedule.query()
            .whereIn('info_id', infoIds)
            .where(DB.raw('YEAR(date)'), this.year)
            .where(DB.raw('MONTH(date)'), this.month)
            .fetch();
        this.schedules = collect(await schedules.toJSON());
    }

    async getAssistances() {
        let infoIds = collect(this.infos.data).pluck('id').toArray();
        let assistances = await Assistance.query()
            .join('schedules as s', 's.id', 'assistances.schedule_id')
            .whereIn('s.info_id', infoIds)
            .where(DB.raw('YEAR(s.date)'), this.year)
            .where(DB.raw('MONTH(s.date)'), this.month)
            .fetch();
        // response
        this.assistances = collect(await assistances.toJSON());
    }

    async getBallots() {
        let infoIds = collect(this.infos.data).pluck('id').toArray();
        let ballots = await Ballot.query()
            .join('schedules as s', 's.id', 'ballots.schedule_id')
            .whereIn('s.info_id', infoIds)
            .where(DB.raw('YEAR(s.date)'), this.year)
            .where(DB.raw('MONTH(s.date)'), this.month)
            .select('ballots.*')
            .fetch();
        this.ballots = collect(await ballots.toJSON());
    }

    async settingBody() {
        let newInfos = this.infos.data || [];
        for(let info of newInfos) {

            // obtener people
            let person = this.people.where('id', info.work.person_id).first() || {};
            info.work.person = person;

            let newDates = JSON.parse(JSON.stringify(this.dates));
            info.dates = newDates;
            info.count = 0;

            // precargar datos
            for(let date of info.dates) {

                // coleción de descuentos
                date.discounts = collect([]);

                // obtener schedule
                let current_schedule = await this.schedules.where('info_id', info.id).where('date', date.date).first();
                if (current_schedule) {

                    // validar ballots
                    let ballots = await this.ballots.where('schedule_id', current_schedule.id).toArray();
                    for(let ballot of ballots) {
                        date.discounts.push({
                            type: 'App/Models/Ballot',
                            object: ballot
                        });
                    }

                    // agregar contador de schedule
                    date.schedule = current_schedule;
                    info.count += current_schedule.discount;
                }


                // validar vacaciones
                let vacation = await this.vacations.where('work_id', info.work_id)
                    .where('date_start', '<=', date.date)
                    .where('date_over', '>=', date.date)
                    .first();
                if (vacation) {
                    date.discounts.push({
                        type: 'App/Models/Vacation',
                        object: vacation
                    });
                }


                // validar licenses
                let license = await this.licenses.where('info_id', info.id)
                    .where('date_start', '<=', date.date)
                    .where('date_over', '>=', date.date)
                    .first();
                if (license) {
                    date.discounts.push({
                        type: 'App/Models/License',
                        object: license
                    });
                }


                // validar permissions
                let permission = await this.permissions.where('info_id', info.id)
                    .where('date_start', '<=', date.date)
                    .where('date_over', '>=', date.date)
                    .first();
                if (permission) {
                    date.discounts.push({
                        type: 'App/Models/Permission',
                        object: permission
                    });
                }
            };
        }   
    }

    async handle() {
        // obtener dates
        await this.getDates();
        // obtener infos
        await this.getInfos();
        // onbtener people
        await this.getPeople();
        // obtener vacations
        await this.getVacationes();
        // obetener licenses
        await this.getLicenses();
        // obtener permissions 
        await this.getPermissions();
        // obtener horario
        await this.getSchedules();
        // obtener assistances
        await this.getAssistances();
        // obtener ballots
        await this.getBallots();
        // setting datos
        await this.settingBody();
        // response
        return this.infos;
    }

}

module.exports = DiscountBuilder;