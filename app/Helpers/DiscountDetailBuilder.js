'use strict';

const Vacation = use('App/Models/Vacation');
const DB = use('Database');
const Schedule = use('App/Models/Schedule');
const License = use('App/Models/License');

class DiscountDetailBuilder {

    filtros = { 
        cargo_id: "",
        type_categoria_id: ""
    }

    constructor(entity_id, config_discount = {}, filtros = this.filtros) {
        this.entity_id = entity_id;
        this.config_discount = config_discount;
        this.filtros = filtros;
    }

    handleFiltros(model, prefix = "") {
        for(let attr in this.filtros) {
            let value = this.filtros[attr];
            if (value) model.where(`${prefix ? `${prefix}.${attr}` : attr}`, value);
        }

        return model;
    }

    async getVacations() {
        let count_vacations = Vacation.query()
            .join('config_vacations as c', 'c.id', 'vacations.config_vacation_id')
            .join('infos as i', 'i.work_id', 'c.work_id')
            .join('config_discounts as c_dis', 'c_dis.entity_id', 'i.entity_id')
            .join('discounts as d', 'd.config_discount_id', 'c_dis.id')
            .where('c_dis.id', this.config_discount.id)
            .where(DB.raw('(YEAR(vacations.date_start) <= c_dis.year AND MONTH(vacations.date_start) <= c_dis.month)'))
            .where(DB.raw('(YEAR(vacations.date_over) >= c_dis.year AND MONTH(vacations.date_over) >= c_dis.month)'))
            .groupBy('i.id')
            .select('i.id')
        // filtrar
        count_vacations = this.handleFiltros(count_vacations, 'i');
        // obtener vacations
        count_vacations = await count_vacations.getCount('id');
        this.count_vacations = count_vacations;
    }

    async getLacks() {
        let count_lack = Schedule.query()
            .join('infos as i', 'i.id', 'schedules.info_id')
            .join('config_discounts as c', 'c.entity_id', 'i.entity_id')
            .join('discounts as d', 'd.config_discount_id', 'c.id')
            .where('c.id', this.config_discount.id)
            .where(DB.raw('(YEAR(schedules.date) = c.year AND MONTH(schedules.date) = c.month)'))
            .where('schedules.status', 'F')
            .groupBy('i.id')
            .select('i.id')
        // filters
        count_lack = this.handleFiltros(count_lack, 'i');
        // obtener count
        count_lack = await count_lack.getCount('id');
        this.count_lack = count_lack;
    }

    async getDelays() {
        let count_delay = Schedule.query()
            .join('infos as i', 'i.id', 'schedules.info_id')
            .join('config_discounts as c', 'c.entity_id', 'i.entity_id')
            .join('discounts as d', 'd.config_discount_id', 'c.id')
            .where('c.id', this.config_discount.id)
            .where(DB.raw('(YEAR(schedules.date) = c.year AND MONTH(schedules.date) = c.month)'))
            .where('schedules.status', 'A')
            .where('schedules.discount', '>', 0)
            .groupBy('i.id')
            .select('i.id')
        count_delay = this.handleFiltros(count_delay, 'i');
        // obtener datos
        count_delay = await count_delay.getCount('id');
        this.count_delay = count_delay;
    }

    async getCommitions() {
        let count_commission = Schedule.query()
            .join('infos as i', 'i.id', 'schedules.info_id')
            .join('config_discounts as c', 'c.entity_id', 'i.entity_id')
            .join('discounts as d', 'd.config_discount_id', 'c.id')
            .join('ballots as b', 'b.schedule_id', 'schedules.id')
            .where('c.id', this.config_discount.id)
            .where(DB.raw('(YEAR(schedules.date) = c.year AND MONTH(schedules.date) = c.month)'))
            .where('schedules.status', 'A')
            .where('schedules.discount', '>', 0)
            .where('b.is_applied', 0)
            .groupBy('i.id')
            .select('i.id');
        // filrar
        count_commission = this.handleFiltros(count_commission, 'i');
        // obtener
        count_commission = await count_commission.getCount('id');
        this.count_commission = count_commission;
    }

    async getLicenses(is_pay = 1) {
        let count_license = License.query()
            .join('infos as i', 'i.id', 'licenses.info_id')
            .join('config_discounts as c', 'c.entity_id', 'i.entity_id')
            .join('discounts as d', 'd.info_id', 'i.id')
            .where('c.entity_id', this.config_discount.id)
            .where(DB.raw('(YEAR(licenses.date_start) <= c.year AND MONTH(licenses.date_start) <= c.month)'))
            .where(DB.raw('(YEAR(licenses.date_over) >= c.year AND MONTH(licenses.date_over) >= c.month)'))
            .where('licenses.is_pay', is_pay)
            .groupBy('i.id')
            .select('i.id')
        // filters
        count_license = this.handleFiltros(count_license, 'i');
        // obteners
        count_license = await count_license.getCount('id');

        if (is_pay) this.count_license_is_pay = count_license;
        else this.count_license_is_not_pay = count_license;
    }

    generateDetails() {
        return [
            { index: "V", text: "Vacaciones", count: this.count_vacations },
            { index: "F", text: "Faltas", count: this.count_lack },
            { index: "T", text: "Tardanza", count: this.count_delay },
            { index: "CS", text: "Comisión de Servicio", count: this.count_commission },
            { index: "LCG", text: "Licencia con Gose", count: this.count_license_is_pay },
            { index: "LSG", text: "Licencia sin Gose", count: this.count_license_is_not_pay }
        ]
    }

    async handle() {
        // obtener vacaciones
        await this.getVacations();
        // obtener lacks
        await this.getLacks();
        // obtener delys
        await this.getDelays();
        // obtener commisions
        await this.getCommitions();
        // obtenet license is_pay
        await this.getLicenses(1);
        // obtener license is no pay
        await this.getLicenses(0);
        // response
        return this.generateDetails();
    }

}

module.exports = DiscountDetailBuilder;