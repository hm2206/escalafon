'use strict';

const BaseProcedure = require('./BaseProcedure');

class PrepareDiscountProcedure extends BaseProcedure {

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

    static queryAddDiscount () {
        return `
            INSERT INTO discounts(info_id, year, month, base, days, hours, discount_min, discount, verify)
            SELECT i.id, ${this.params.year.name} as new_year, ${this.params.month.name} as new_month, SUM(c.monto) as base,
            IF((i.fecha_de_ingreso is null OR i.fecha_de_ingreso = '') 
            OR (i.fecha_de_cese is null OR i.fecha_de_cese = ''), 30, 
            IF(DATEDIFF(i.fecha_de_cese, i.fecha_de_ingreso) + 1 >= 30, 30, DATEDIFF(i.fecha_de_cese, i.fecha_de_ingreso) + 1)) as days, 
            i.hours, 0 as discount_min, 0 as discount, 0 as verify
            FROM infos as i
            INNER JOIN config_infos as c ON c.info_id = i.id 
            WHERE i.entity_id = ${this.params.entity_id.name}
            AND c.base = 0
            AND i.estado = 1
            AND EXISTS (
                SELECT null FROM schedules as s
                WHERE s.info_id = i.id AND
                YEAR(s.date) = ${this.params.year.name} AND MONTH(s.date) = ${this.params.month.name}
            ) AND NOT EXISTS(
                    SELECT null FROM discounts as dis 
                    WHERE dis.info_id = i.id AND dis.year = ${this.params.year.name} AND dis.month = ${this.params.month.name}
            )
            GROUP BY i.id, i.fecha_de_ingreso, i.fecha_de_cese, i.hours;
        `
    }

    static queryUpdateStatus() {
        return `
            UPDATE schedules as sch 
            INNER JOIN (
                SELECT s.id, s.date, 
                (SELECT count(*) FROM assistances as a 
                where a.schedule_id = s.id) as total
                FROM schedules as s
                INNER JOIN infos as i ON i.id = s.info_id
                WHERE i.entity_id = ${this.params.entity_id.name}
                AND YEAR(s.date) = ${this.params.year.name}
                AND MONTH(s.date) = ${this.params.month.name}
            ) as up ON up.id = sch.id 
            SET sch.status = IF(up.total > 0, 'A', 'F');
        `
    }

    static queryUpdateLack() {
        return `
            UPDATE schedules as s
            INNER JOIN infos as i ON i.id = s.info_id
            SET s.discount = (i.hours * 60)
            WHERE i.entity_id = ${this.params.entity_id.name}
            AND YEAR(s.date) = ${this.params.year.name}
            AND MONTH(s.date) = ${this.params.month.name}
            AND s.status = 'F';
        `
    }

    static get query () {
        return [ 
            this.queryAddDiscount(),
            this.queryUpdateStatus(),
            this.queryUpdateLack(),
        ];
    }

}

module.exports = PrepareDiscountProcedure;