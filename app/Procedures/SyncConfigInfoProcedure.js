'use strict';

const BaseProcedure = require('./BaseProcedure');

class SyncConfigInfoProcedure extends BaseProcedure {

    static get params () {
        return {
            info_id: { type: 'int', name: 'p_info_id', length: 20 }
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

    static queryRemuneracion () {
        return `
            INSERT INTO config_infos(info_id, type_remuneracion_id, monto, base)
            SELECT info.id, cat.type_remuneracion_id, cat.monto, type.base
            FROM categorias AS cat
            INNER JOIN infos AS info ON info.type_categoria_id = cat.type_categoria_id AND cat.planilla_id = info.planilla_id
            INNER JOIN type_remuneracions AS type ON type.id = cat.type_remuneracion_id
            WHERE info.id = p_info_id AND NOT EXISTS (
            SELECT NULL FROM config_infos AS con WHERE con.type_remuneracion_id = cat.type_remuneracion_id
            AND con.info_id = p_info_id);
        `
    }

    static queryDescuentos () {
        return `
            INSERT INTO info_type_descuentos(info_id, type_descuento_id, monto)
            SELECT inf.id, ty.type_descuento_id, ty.monto
            FROM planilla_type_descuentos as ty
            INNER JOIN infos as inf ON inf.planilla_id = ty.planilla_id
            AND inf.type_categoria_id = ty.type_categoria_id
            WHERE inf.id = p_info_id AND inf.estado = 1 AND NOT EXISTS(
            SELECT null FROM info_type_descuentos as con WHERE con.info_id = inf.id
            AND con.type_descuento_id = ty.type_descuento_id);
        `
    }

    static get query () {
        return [
            this.queryRemuneracion(),
            this.queryDescuentos(),
        ];
    }

}

module.exports = SyncConfigInfoProcedure;