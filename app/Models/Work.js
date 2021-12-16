'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment');

class Work extends Model {

    // gettings
    getFechaDeAfiliacion (value) {
        return value ? moment(value).format('YYYY-MM-DD') : null;
    }

    getFechaDeIngreso (value) {
        return value ? moment(value).format('YYYY-MM-DD') : null;
    }

    // relations
    banco () {
        return this.belongsTo('App/Models/Banco');
    }

    afp () {
        return this.belongsTo('App/Models/Afp');
    }

    infos () {
        return this.hasMany('App/Models/Info');
    }

    infoCurrent() {
        return this.hasOne('App/Models/Info')
            .join('planillas as p', 'p.id', 'infos.planilla_id')
            .where('p.principal', 1)
            .where('infos.estado', 1);
    }

}

module.exports = Work
