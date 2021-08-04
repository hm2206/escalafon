'use strict';

const BaseProcedure = require('./BaseProcedure');

class UpdateAssistanceStatusProcedure extends BaseProcedure {

    static get params () {
        return {
            schedule_id: { type: 'int', name: 'p_schedule_id', length: 20 }
        }
    }

    static get arguments () {
        return {
            schedule_id: '',
        }
    }

    static get query () {
        return [ 
            `UPDATE assistances as asi`,
            `INNER JOIN (`,
            `SELECT *, IF(((@rownum:=@rownum+1) % 2) = 0, 'EXIT', 'ENTRY') as real_status`,
            `FROM assistances as a, (SELECT @rownum:=0) r`,
            `WHERE a.schedule_id = ${this.params.schedule_id.name}`,
            `ORDER BY a.record_time ASC`,
            `) as up ON up.id = asi.id`,
            `SET asi.status = up.real_status;`
        ];
    }

}

module.exports = UpdateAssistanceStatusProcedure;