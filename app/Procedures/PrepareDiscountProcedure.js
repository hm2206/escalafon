'use strict';

const BaseProcedure = require('./BaseProcedure');

class PrepareDiscountProcedure extends BaseProcedure {

    static get params () {
        return {
            config_discount_id: { type: 'int', name: 'p_config_discount_id', length: 20 },
        }
    }

    static get arguments () {
        return {
            econfig_discount_id: ''
        }
    }

    static queryAddDiscount () {
        return `
            INSERT INTO discounts(info_id, config_discount_id, base, days, hours, discount_min, discount, verify)
            SELECT i.id, ${this.params.config_discount_id.name}, SUM(c.monto) as base,
            IF((i.fecha_de_ingreso is null OR i.fecha_de_ingreso = '') 
            OR (i.fecha_de_cese is null OR i.fecha_de_cese = ''), 30, 
            IF(DATEDIFF(i.fecha_de_cese, i.fecha_de_ingreso) + 1 >= 30, 30, DATEDIFF(i.fecha_de_cese, i.fecha_de_ingreso) + 1)) as days, 
            i.hours, 0 as discount_min, 0 as discount, 0 as verify
            FROM infos as i
            INNER JOIN config_infos as c ON c.info_id = i.id 
            INNER JOIN config_discounts as c_dis ON c_dis.entity_id = i.entity_id
            WHERE c_dis.id = ${this.params.config_discount_id.name}
            AND c.base = 0
            AND i.estado = 1
            AND EXISTS (
                SELECT null FROM schedules as s
                WHERE s.info_id = i.id AND
                YEAR(s.date) = c_dis.year AND MONTH(s.date) = c_dis.month
            ) AND NOT EXISTS(
                    SELECT null FROM discounts as dis 
                    WHERE dis.info_id = i.id AND dis.config_discount_id = c_dis.id
            )
            GROUP BY i.id, i.fecha_de_ingreso, i.fecha_de_cese, i.hours;
        `
    }

    static queryUpdateStatus() {
        return `
            UPDATE schedules as s
            INNER JOIN infos as i ON i.id = s.info_id
            INNER JOIN config_discounts as c ON c.entity_id = i.entity_id
            SET s.status = 'A', s.discount = 0
            WHERE c.id = ${this.params.config_discount_id.name}
            AND YEAR(s.date) = c.year
            AND MONTH(s.date) = c.month
            AND s.is_edited = 0;
        `
    }

    static get query () {
        return [ 
            this.queryAddDiscount(),
            this.queryUpdateStatus(),
        ];
    }

}

module.exports = PrepareDiscountProcedure;