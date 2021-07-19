'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment');

class Vacation extends Model {

    static boot () {
        super.boot();
        this.addHook('beforeSave', 'VacationHook.addDaysUsed');
    }

    getDateStart(value) {
        return moment(value).format('YYYY-MM-DD');
    }

    getDateOver(value) {
        return moment(value).format('YYYY-MM-DD');
    }

    config_vacation() {
        return this.belongsTo('App/Models/ConfigVacation');
    }

}

module.exports = Vacation
