'use strict';

const BaseProcedure = require('./BaseProcedure');

class CalcDiscountProcedure extends BaseProcedure {

    static get params () {
        return {
            entity_id: { type: 'int', name: 'p_entity_id', length: 20 },
            year: { type: 'int', name: 'p_year', length: 4 },
            month: { type: 'int', name: 'p_month', length: 2 }
        }
    }

    static get arguments () {
        return {
            entity_id: '', 
            year: '',
            month: ''
        }
    }

    static queryUpdateBallots() {
        return `
            UPDATE schedules as sch INNER JOIN (
                SELECT s.id,
                (
                    SELECT IFNULL(SUM(b.total), 0) as total FROM ballots as b 
                    WHERE b.schedule_id = s.id
                    AND b.is_applied = 1
                ) as discount,
                (
                    SELECT IFNULL(SUM(b.total), 0) as total FROM ballots as b 
                    WHERE b.schedule_id = s.id
                    AND b.is_applied = 0
                ) as nodiscount
                FROM schedules as s
                INNER JOIN infos as i ON i.id = s.info_id
                INNER JOIN ballots as ba ON ba.schedule_id = s.id
                WHERE i.entity_id = ${this.params.entity_id.name}
                AND YEAR(s.date) = ${this.params.year.name}
                AND MONTH(s.date) = ${this.params.month.name}
                GROUP BY s.id
            ) as up ON up.id = sch.id
            SET sch.discount = IF((up.discount - up.nodiscount) <= 0, 0, (up.discount - up.nodiscount)),
            sch.status = 'A';
        `
    }

    static queryUpdatePermissions() {
        return `
            UPDATE schedules as s
            INNER JOIN infos as i ON i.id = s.info_id
            INNER JOIN permissions as p ON p.info_id = i.id
            SET s.discount = 0, s.status = 'D'
            WHERE i.entity_id = ${this.params.entity_id.name}
            AND YEAR(s.date) = ${this.params.year.name}
            AND MONTH(s.date) = ${this.params.month.name}
            AND (p.date_start <= s.date AND p.date_over >= s.date);
        `
    }

    static queryUpdateLicenses() {
        return `
            UPDATE schedules as s
            INNER JOIN infos as i ON i.id = s.info_id
            INNER JOIN licenses as l ON l.info_id = i.id
            SET s.discount = 0, s.status = 'D'
            WHERE i.entity_id = ${this.params.entity_id.name}
            AND YEAR(s.date) = ${this.params.year.name}
            AND MONTH(s.date) = ${this.params.month.name}
            AND (l.date_start <= s.date AND l.date_over >= s.date);
        `
    }

    static queryUpdateVacations() {
        return `
            UPDATE schedules as s 
            INNER JOIN infos as i ON i.id = s.info_id
            INNER JOIN config_vacations as c ON c.work_id = i.work_id
            INNER JOIN vacations as v ON v.config_vacation_id = c.id
            AND c.entity_id = i.entity_id
            AND (v.date_start <= s.date AND v.date_over >= s.date)
            SET s.discount = 0, s.status = 'D'
            WHERE i.entity_id = ${this.params.entity_id.name}
            AND YEAR(s.date) = ${this.params.year.name}
            AND MONTH(s.date) = ${this.params.month.name};
        `;
    }

    static queryCalcDiscount () {
        return `
            UPDATE discounts as dis 
            INNER JOIN (
                SELECT d.id, d.info_id, d.year, d.month, d.days, d.hours, d.base, (ROUND(((d.base / d.days) / d.hours) / 60, 2)) as min, IFNULL(SUM(s.discount), 0) as delay
                FROM discounts as d
                INNER JOIN infos as i ON i.id = d.info_id 
                LEFT JOIN schedules as s ON s.info_id = i.id 
                AND YEAR(s.date) = d.year AND MONTH(s.date) = d.month
                WHERE i.entity_id = ${this.params.entity_id.name}
                AND d.year = ${this.params.year.name}
                AND d.month = ${this.params.month.name}
                GROUP BY d.info_id, d.year, d.month, d.days, d.hours, d.base
            ) as calc ON calc.id  = dis.id
            SET dis.discount = ROUND(calc.min * calc.delay, 2),
            dis.discount_min = calc.min
            WHERE calc.id = dis.id;
        `
    }

    static get query () {
        return [ 
            this.queryUpdateBallots(),
            this.queryUpdatePermissions(),
            this.queryUpdateLicenses(),
            this.queryUpdateVacations(),
            this.queryCalcDiscount(),
        ];
    }

}

module.exports = CalcDiscountProcedure;