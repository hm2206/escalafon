'use strict';

const BaseProcedure = require('./BaseProcedure');

class SyncScheduleInfosProcedure extends BaseProcedure {

    static get params () {
        return {
            info_id: { type: 'int', name: 'p_info_id', length: 20 },
            entity_id: {  type: 'int', name: 'p_entity_id', length: 20 },
            planilla_id: {  type: 'int', name: 'p_planilla_id', length: 20 },
            cargo_id: { type: 'int', name : 'p_cargo_id', length: 20 },
            type_categoria_id: { type: 'int', name : 'p_type_categoria_id', length: 20 },
        }
    }

    static get arguments () {
        return {
            info_id: '',
            entity_id: '',
            planilla_id: '',
            cargo_id: '',
            type_categoria_id: ''
        }
    }

    static queryInsert () {
        return [
            "INSERT INTO schedules(info_id, `index`, `date`, time_start, delay_start, time_over, modo, observation)",
            `${this.queryInfos()};`
        ]
    }

    static queryInfos (count = false) {
        return `
            SELECT ${count ? 'COUNT(*) INTO v_count' : 'i.id, up.index, up.date, up.time_start , up.delay_start, up.time_over, up.modo, up.observation'}
            FROM infos as i INNER JOIN (
            SELECT s.index, s.date, s.time_start, s.time_over, s.delay_start, s.modo, s.observation
            FROM infos as inf INNER JOIN schedules as s ON s.info_id = inf.id where inf.id = ${this.params.info_id.name}) as up
            WHERE i.entity_id = ${this.params.entity_id.name}
            AND i.planilla_id = ${this.params.planilla_id.name}
            AND IF(${this.params.cargo_id.name} = 0, 1, i.cargo_id = ${this.params.cargo_id.name})
            AND IF(${this.params.type_categoria_id.name} = 0, 1, i.type_categoria_id = ${this.params.type_categoria_id.name})
            AND i.estado = 1
            AND NOT EXISTS (SELECT null FROM schedules as sch WHERE sch.info_id = i.id AND sch.index = sch.index
            AND sch.date = up.date AND (sch.time_start = up.time_start OR sch.time_over = up.time_over) AND sch.modo = up.modo)
        `
    }

    static get query () {
        return [
            "DECLARE v_count INT(20);",
            `${this.queryInfos(true)};`,
            ...this.queryInsert(),
            "SELECT v_count as `rows`;"
        ];
    }

}

module.exports = SyncScheduleInfosProcedure;