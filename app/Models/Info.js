'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment');

class Info extends Model {
    static boot () {
        super.boot();
        this.addHook('afterCreate', 'InfoHook.syncConfig');
    }

    // gettings
    getFechaDeResolucion (value) {
        return value ? moment(value).format('YYYY-MM-DD') : null;
    } 

    getFechaDeIngreso (value) {
        return value ? moment(value).format('YYYY-MM-DD') : null;
    }

    getFechaDeCese (value) {
        return value ? moment(value).format('YYYY-MM-DD') : null;
    }

    // relations
    work () {
        return this.belongsTo('App/Models/Work');
    }

    planilla () {
        return this.belongsTo('App/Models/Planilla');
    }

    cargo () {
        return this.belongsTo('App/Models/Cargo');
    }    

    type_categoria () {
        return this.belongsTo('App/Models/TypeCategoria');
    }

    meta () {
        return this.belongsTo('App/Models/Meta');
    }

    situacion_laboral () {
        return this.belongsTo('App/Models/SituacionLaboral');
    }

    schedules () {
        return this.hasMany('App/Models/Schedule');
    }

    type_aportacions() {
        return this.belongsToMany('App/Models/TypeAportacion')
            .pivotTable('info_type_aportacion')
    }

}

module.exports = Info
