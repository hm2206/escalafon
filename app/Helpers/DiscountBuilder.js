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

    constructor(entity_id, year, month, page = 1) {
        this.entity_id = entity_id;
        this.year = year;
        this.month = month;
        this.page = 1;
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
        let infos = await Info.query() 
            .join('works as w', 'w.id', 'infos.work_id')
            .join('config_infos as c', 'c.info_id', 'infos.id')
            .with('work', (builder) => builder.select('works.id', 'works.person_id'))
            .with('type_categoria', (builder) => builder.select('type_categorias.id', 'type_categorias.descripcion')) 
            .where('entity_id', this.entity_id)
            .where('infos.id', 17)
            .where('c.base', 0)
            .whereHas('schedules', (builder) => 
                builder.where(DB.raw('YEAR(date)'), this.year)
                .where(DB.raw('MONTH(date)'), this.month)
            )
            .select('infos.id', 'infos.type_categoria_id', 'infos.work_id', DB.raw('SUM(c.monto) as base'))
            .orderBy('w.orden', 'ASC')
            .groupBy('infos.id', 'infos.type_categoria_id', 'infos.work_id')
            .paginate(this.page, 20);
        this.infos = await infos.toJSON();
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
            .fetch();
        this.ballots = collect(await ballots.toJSON());
    }

    async settingBody() {
        let newInfos = this.infos.data || [];
        for(let info of newInfos) {

            let newDates = JSON.parse(JSON.stringify(this.dates));
            info.dates = newDates;

            // precargar datos
            for(let date of info.dates) {


                // coleción de descuentos
                date.discounts = collect([]);
                date.delay = 0;
                date.modo = "A";


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
                    continue;
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
                    continue;
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
                    continue;
                }


                // validar si el trabajador tiene que asistir ese día
                let schedules = await this.schedules.where('info_id', info.id).where('date', date.date);
                let tried = schedules.count();
                if (!tried) {
                    date.modo = "E";
                    continue;
                }


                // validar si el trabajador no asistío
                let plucked = schedules.pluck('id').toArray();
                let assistances = await this.assistances.whereIn('schedule_id', plucked);
                let count_assistance = assistances.count();
                if (!count_assistance) {
                    date.modo = "F";
                    date.delay = 1;
                    continue;
                }


                // validar tardanza
                for (let schedule of schedules) {
                    let delay_assistance = assistances.where('schedule_id', schedule.id).sum('delay');
                    let extra_assistance = assistances.where('schedule_id', schedule.id).sum('extra');
                    let delay = delay_assistance - extra_assistance;
                    // verificar que el trabajador ingresó a su hora esperada
                    if (delay <= 0) continue;
                    //  verificar si el trabajador persentó sustento de papeleta
                    let ballots = await this.ballots.where('schedule_id', schedule.id);
                    let count_ballot = ballots.count();
                    if (!count_ballot) {
                        date.modo = "F";
                        date.delay = 1;
                    }

                    // validar papeletas persentadas
                    for (let ballot of ballots.toArray()) {
                        if (ballot.is_applied) continue;
                        date.modo = "T"
                        date.delay = ballot.total;
                        date.discounts.push({
                            type: 'App/Models/Ballot',
                            object: ballot
                        });
                    }
                }


            };
        }   
    }

    async handle() {
        // obtener dates
        await this.getDates();
        // obtener infos
        await this.getInfos();
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
        return { header: this.dates, body: this.infos }
    }

}

module.exports = DiscountBuilder;