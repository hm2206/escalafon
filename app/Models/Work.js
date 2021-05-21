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

}

module.exports = Work
