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
        cargo_id: "",
        type_categoria_id: "",
    }

    constructor(authentication, config_discount = {}, tmpDatos = this.dataPage) {
        this.dataPage = Object.assign(this.dataPage, tmpDatos);
        this.authentication = authentication;
        this.config_discount = config_discount;
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
        let dateFormat = `${this.config_discount.year}-${this.config_discount.month}-01`;
        let date_over = moment(dateFormat, 'YYYY-MM-DD').add(1, 'months').subtract(1, 'days');
        let lastDay = date_over.format('D');
        for (let day = 1; day <= lastDay; day++) {
            let currentDateFormat = `${this.config_discount.year}-${this.config_discount.month}-${day}`;
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
            .join('config_discounts as c', 'c.id', 'd.config_discount_id')
            .where('c.id', this.config_discount.id)
            .select(
                'infos.id', DB.raw('d.id as discount_id'), 'infos.work_id', 'infos.type_categoria_id', 
                'd.base', 'd.discount_min', 'd.discount', 'd.days', DB.raw('c.id as config_discount_id')
            )
            .orderBy('w.orden', 'ASC')

        // filtrar
        if (this.dataPage.type_categoria_id) infos.where('infos.type_categoria_id', this.dataPage.type_categoria_id)
        if (this.dataPage.cargo_id) infos.where('infos.cargo_id', this.dataPage.cargo_id)
        // paginar
        infos = await infos.paginate(this.dataPage.page, this.dataPage.perPage);
        this.infos = await infos.toJSON();
    }

    async getPeople() {
        let personIds = collect(this.infos.data).pluck('work.person_id').toArray();
        let people = await this.authentication.get(`person?ids[]=${personIds.join('&ids[]=')}&perPage=${this.dataPage.perPage}`)
        .then(res => res.data.people.data || [])
        .catch(() => ([]));
        this.people = collect(people);
    }

    async getVacationes() {
        let workIds = collect(this.infos.data).pluck('work_id').toArray();
        let vacations = await Vacation.query()
            .join('config_vacations as c', 'c.id', 'vacations.config_vacation_id')
            .join('config_discounts as c_dis', 'c_dis.entity_id', 'c.entity_id')
            .where('c_dis.id', this.config_discount.id)
            .whereIn('c.work_id', workIds)
            .where(DB.raw(`( YEAR(vacations.date_start) <= c_dis.year AND YEAR(vacations.date_over) >= c_dis.year )`)) 
            .where(DB.raw(`( MONTH(vacations.date_start) <= c_dis.month AND MONTH(vacations.date_over) >= c_dis.month )`)) 
            .select('vacations.*', 'c.work_id')
            .fetch();
        // response
        this.vacations = collect(await vacations.toJSON());
    }

    async getLicenses() {
        let infoIds = collect(this.infos.data).pluck('id').toArray();
        let licenses = await License.query()
            .join('infos as i', 'i.id', 'licenses.info_id')
            .join('config_discounts as c', 'c.entity_id', 'i.entity_id')
            .with('situacion_laboral')
            .where('c.id', this.config_discount.id)
            .whereIn('info_id', infoIds)
            .where(DB.raw(`( YEAR(licenses.date_start) <= c.year AND YEAR(licenses.date_over) >= c.year )`)) 
            .where(DB.raw(`( MONTH(licenses.date_start) <= c.month AND MONTH(licenses.date_over) >= c.month )`)) 
            .select('licenses.*')
            .fetch();
        // response
        this.licenses = collect(await licenses.toJSON());
    }

    async getPermissions() {
        let infoIds = collect(this.infos.data).pluck('id').toArray();
        let permissions = await Permission.query()
            .join('infos as i', 'i.id', 'permissions.info_id')
            .join('config_discounts as c', 'c.entity_id', 'i.entity_id')
            .with('type_permission')
            .where('c.id', this.config_discount.id)
            .whereIn('info_id', infoIds)
            .where(DB.raw(`( YEAR(permissions.date_start) <= c.year AND YEAR(permissions.date_over) >= c.year )`)) 
            .where(DB.raw(`( MONTH(permissions.date_start) <= c.month AND MONTH(permissions.date_over) >= c.month )`)) 
            .select('permissions.*')
            .fetch();
        // response
        this.permissions = collect(await permissions.toJSON());
    }

    async getSchedules() {
        let infoIds = collect(this.infos.data).pluck('id').toArray();
        let schedules = await Schedule.query()
            .join('infos as i', 'i.id', 'schedules.info_id')
            .join('config_discounts as c', 'c.entity_id', 'i.entity_id')
            .where('c.id', this.config_discount.id)
            .whereIn('info_id', infoIds)
            .where(DB.raw('YEAR(date) = c.year'))
            .where(DB.raw('MONTH(date) = c.month'))
            .select('schedules.*')
            .fetch();
        this.schedules = collect(await schedules.toJSON());
    }

    async getAssistances() {
        let infoIds = collect(this.infos.data).pluck('id').toArray();
        let assistances = await Assistance.query()
            .join('schedules as s', 's.id', 'assistances.schedule_id')
            .join('infos as i', 'i.id', 's.info_id')
            .join('config_discounts as c', 'c.entity_id', 'i.entity_id')
            .where('c.id', this.config_discount.id)
            .whereIn('s.info_id', infoIds)
            .where(DB.raw('YEAR(s.date) = c.year'))
            .where(DB.raw('MONTH(s.date) = c.month'))
            .select('assistances.*')
            .fetch();
        // response
        this.assistances = collect(await assistances.toJSON());
    }

    async getBallots() {
        let infoIds = collect(this.infos.data).pluck('id').toArray();
        let ballots = await Ballot.query()
            .join('schedules as s', 's.id', 'ballots.schedule_id')
            .join('infos as i', 'i.id', 's.info_id')
            .join('config_discounts as c', 'c.entity_id', 'i.entity_id')
            .where('c.id', this.config_discount.id)
            .whereIn('s.info_id', infoIds)
            .where(DB.raw('YEAR(s.date) = c.year'))
            .where(DB.raw('MONTH(s.date) = c.month'))
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