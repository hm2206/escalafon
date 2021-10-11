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
const xlsx = require('node-xlsx');

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

    constructor(authentication, config_discount = {}, tmpDatos = this.dataPage, type = 'json') {
        this.dataPage = Object.assign(this.dataPage, tmpDatos);
        this.authentication = authentication;
        this.config_discount = config_discount;
        this.type = type;
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
                year: currentDate.year(),
                month: currentDate.month() + 1,
                day: currentDate.format('DD'),
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
        infos = this.type == 'json' ? await infos.paginate(this.dataPage.page, this.dataPage.perPage) : await infos.fetch();
        this.infos = await infos.toJSON();
    }

    async getPeople() {
        let personIds = collect(this.type == 'json' ? this.infos.data : this.infos).pluck('work.person_id').chunk(this.dataPage.perPage).toArray();
        this.people = collect([]);
        for(let ids of personIds) {
            let people = await this.authentication.get(`person?ids[]=${ids.join('&ids[]=')}&perPage=${this.dataPage.perPage}`)
            .then(res => res.data.people.data || [])
            .catch(() => ([]));
            this.people.push(...people);
        }
    }

    async getVacationes() {
        let vacations = await Vacation.query()
            .join('config_vacations as c', 'c.id', 'vacations.config_vacation_id')
            .join('config_discounts as c_dis', 'c_dis.entity_id', 'c.entity_id')
            .join('discounts as dis', 'dis.config_discount_id', 'c_dis.id')
            .join('infos as inf', 'inf.id', 'dis.info_id')
            .where('c_dis.id', this.config_discount.id)
            .where(DB.raw(`( YEAR(vacations.date_start) <= c_dis.year AND YEAR(vacations.date_over) >= c_dis.year )`)) 
            .where(DB.raw(`( MONTH(vacations.date_start) <= c_dis.month AND MONTH(vacations.date_over) >= c_dis.month )`)) 
            .select('vacations.*', 'c.work_id')
            .fetch();
        // response
        this.vacations = collect(await vacations.toJSON());
    }

    async getLicenses() {
        let licenses = await License.query()
            .join('infos as i', 'i.id', 'licenses.info_id')
            .join('discounts as dis', 'dis.info_id', 'i.id')
            .join('config_discounts as c', 'c.id', 'dis.config_discount_id')
            .with('situacion_laboral')
            .where('c.id', this.config_discount.id)
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
        let schedules = await Schedule.query()
            .join('infos as i', 'i.id', 'schedules.info_id')
            .join('discounts as dis', 'dis.info_id', 'i.id')
            .join('config_discounts as c', 'c.id', 'dis.config_discount_id')
            .where('c.id', this.config_discount.id)
            .where(DB.raw('YEAR(date) = c.year'))
            .where(DB.raw('MONTH(date) = c.month'))
            .select('schedules.*')
            .fetch();
        this.schedules = collect(await schedules.toJSON());
    }

    async getAssistances() {
        let assistances = await Assistance.query()
            .join('schedules as s', 's.id', 'assistances.schedule_id')
            .join('infos as i', 'i.id', 's.info_id')
            .join('discounts as dis', 'dis.info_id', 'i.id')
            .join('config_discounts as c', 'c.id', 'dis.config_discount_id')
            .where('c.id', this.config_discount.id)
            .where(DB.raw('YEAR(s.date) = c.year'))
            .where(DB.raw('MONTH(s.date) = c.month'))
            .select('assistances.*')
            .fetch();
        // response
        this.assistances = collect(await assistances.toJSON());
    }

    async getBallots() {
        let ballots = await Ballot.query()
            .join('schedules as s', 's.id', 'ballots.schedule_id')
            .join('infos as i', 'i.id', 's.info_id')
            .join('discounts as dis', 'dis.info_id', 'i.id') 
            .join('config_discounts as c', 'c.id', 'dis.config_discount_id')
            .where('c.id', this.config_discount.id)
            .where(DB.raw('YEAR(s.date) = c.year'))
            .where(DB.raw('MONTH(s.date) = c.month'))
            .select('ballots.*')
            .fetch();
        this.ballots = collect(await ballots.toJSON());
    }

    async settingBody() {
        let newInfos = this.type == 'json' ? this.infos.data || [] : this.infos || [];
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

    displayItemText(item = {}) {
        const letterTypes = {
            vacation: "App/Models/Vacation",
            permission: "App/Models/Permission",
            license: "App/Models/License",
            ballot: "App/Models/Ballot"
        } 

        const current_type = item.type
        const current_object = item.object || {};

        if (letterTypes.ballot == current_type) {
            return current_object?.is_applied ? 'P' : 'CS'
        } else if (letterTypes.vacation == current_type) {
            return 'V';
        } else if (letterTypes.license == current_type) {
            return current_object?.is_pay ? 'LCG' : 'LSG'
        } else if (letterTypes.permission == current_type) {
            return 'P'
        } else return '';
    }

    displayText(date) {
        const discounts =  date.discounts.toArray();
        const isDiscounts = discounts.length ? true : false; 
        const currentSchedule = date.schedule || {};
        const currentStatus = currentSchedule.status || 'D';
        const currentDiscount = currentSchedule.discount || 0;
        // validaciones
        const isSuccess = !isDiscounts && currentStatus == "A" && !currentDiscount;
        const isDanger = currentStatus == "F";
        const isWarning = currentStatus == "A" && !isSuccess
        const isPrimary = currentStatus == 'D' && isDiscounts;
        let response = [];
        // viewer
        if (isDanger) {
            return 'F';
        } else if(isPrimary) {
            for(let dis of discounts) response.push(`${this.displayItemText(dis)}`);
            return response.join(', ');
        } else if (isSuccess) {
            return '.'
        } else if (isWarning) {
            if (currentDiscount) return currentDiscount;
            for(let dis of discounts) response.push(`${this.displayItemText(dis)}`);
            return response.join(', ');
        } else {
            return '';
        }
    }

    async formatExcel() {
        let headers = ['N° TRAB', 'APELLIDOS Y NOMBRES', 'N° DOCUMENTO', 'CAT.NIV'];
        await this.dates.forEach(d => headers.push(`${d.day}/${d.text}`));
        headers.push('TOT MIN', 'TOTAL DCTO', 'DCTO X MIN', 'BASE DE CALCULO')
        let types = {
            "App/Models/License": "L",
            "App/Models/Vacation": "V"
        }
        let body = [];
        await this.infos.map((i, index) => {
            const payload = [
                index + 1,
                `${i.work.person.fullname}`.toUpperCase(),
                `${i.work.person.document_number}`.toUpperCase(),
                `${i.type_categoria.descripcion}`
            ]
            // dates
            for(let d of i.dates) {
                // verificar si no tiene horario
                let item = this.displayText(d);
                payload.push(item);
            }
            // agregar totales
            payload.push(i.count, i.discount, i.discount_min, i.base);
            // add body
            body.push(payload);
        });
        const data = [headers, ...body];
        let result = await xlsx.build([{ name: `descuentos-${this.config_discount.year}-${this.config_discount.month}`, data }]);
        let mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        return { mime, result }
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
        // formato
        if (this.type == 'excel') {
            return await this.formatExcel();
        }
        // response
        return this.infos;
    }

}

module.exports = DiscountBuilder;