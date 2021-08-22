'use strict';

const BaseProcedure = require('./BaseProcedure');

class CalcDiscountProcedure extends BaseProcedure {

    static get params () {
        return {
            config_discount_id: { type: 'int', name: 'p_config_discount_id', length: 20 },
        }
    }

    static get arguments () {
        return {
            config_discount_id: '',
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
                INNER JOIN config_discounts as c ON c.entity_id = i.entity_id
                INNER JOIN ballots as ba ON ba.schedule_id = s.id
                WHERE c.id = ${this.params.config_discount_id.name}
                AND YEAR(s.date) = c.year
                AND MONTH(s.date) = c.month
                AND s.is_edited = 0
                GROUP BY s.id
            ) as up ON up.id = sch.id
            SET sch.discount = IF((up.discount - up.nodiscount) <= 0, 0, (up.discount - up.nodiscount)),
            sch.status = 'A';
        `
    }

    static queryUpdateLicenses() {
        return `
            UPDATE schedules as s
            INNER JOIN infos as i ON i.id = s.info_id
            INNER JOIN config_discounts as c ON c.entity_id = i.entity_id
            INNER JOIN licenses as l ON l.info_id = i.id
            SET s.discount = 0, s.status = 'D'
            WHERE c.id = ${this.params.config_discount_id.name}
            AND YEAR(s.date) = c.year
            AND MONTH(s.date) = c.month
            AND (l.date_start <= s.date AND l.date_over >= s.date);
        `
    }

    static queryUpdateVacations() {
        return `
            UPDATE schedules as s 
            INNER JOIN infos as i ON i.id = s.info_id
            INNER JOIN config_discounts as c_dis ON c_dis.entity_id = i.entity_id
            INNER JOIN config_vacations as c ON c.work_id = i.work_id
            INNER JOIN vacations as v ON v.config_vacation_id = c.id
            AND c.entity_id = i.entity_id
            AND (v.date_start <= s.date AND v.date_over >= s.date)
            SET s.discount = 0, s.status = 'D'
            WHERE c_dis.id = ${this.params.config_discount_id.name}
            AND YEAR(s.date) = c_dis.year
            AND MONTH(s.date) = c_dis.month;
        `;
    }

    static queryCalcDiscount () {
        return `
            UPDATE discounts as dis 
            INNER JOIN (
                SELECT d.id, d.info_id, d.days, d.hours, d.base, (ROUND(((((d.base * d.days) / 30) / 30) / d.hours) / 60, 2)) as min, IFNULL(SUM(s.discount), 0) as delay
                FROM discounts as d
                INNER JOIN infos as i ON i.id = d.info_id 
                INNER JOIN config_discounts as c ON c.id = d.config_discount_id
                LEFT JOIN schedules as s ON s.info_id = i.id 
                AND YEAR(s.date) = c.year AND MONTH(s.date) = c.month
                WHERE c.id = ${this.params.config_discount_id.name}
                GROUP BY d.id, d.info_id, d.days, d.hours, d.base
            ) as calc ON calc.id  = dis.id
            SET dis.discount = ROUND(calc.min * calc.delay, 2),
            dis.discount_min = calc.min
            WHERE calc.id = dis.id;
        `
    }

    static get query () {
        return [ 
            this.queryUpdateBallots(),
            this.queryUpdateLicenses(),
            this.queryUpdateVacations(),
            this.queryCalcDiscount(),
        ];
    }

}

module.exports = CalcDiscountProcedure;