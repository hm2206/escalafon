'use strict';

const BaseProcedure = require('./BaseProcedure');

class AddHourhandProcedure extends BaseProcedure {

    static get params () {
        return {
            date: { type: 'varchar', name: 'p_date', length: 10 },
            index: { type: 'integer', name: 'p_index', length: 1 },
        }
    }

    static get arguments () {
        return {
            date: '',
            index: 1,
        }
    }

    static get query () {
        return [ 
            "INSERT INTO schedules(info_id, `index`, `date`, time_start, delay_start, time_over, modo)",
            `SELECT i.id, c.\`index\`, ${this.params.date.name}, c.time_start, c.delay_start, c.time_over, c.modo`,
            `FROM hourhands as h `,
            `INNER JOIN config_hourhands as c ON c.hourhand_id = h.id`,
            `INNER JOIN infos as i ON i.hourhand_id = h.id`,
            `WHERE c.\`index\` = ${this.params.index.name} AND i.estado = 1`,
            `AND NOT EXISTS(SELECT null FROM schedules as ss WHERE ss.info_id = i.id AND ss.\`date\` = ${this.params.date.name});`
        ];
    }

}

module.exports = AddHourhandProcedure;