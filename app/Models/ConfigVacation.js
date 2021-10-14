'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment')

class ConfigVacation extends Model {

    static boot () {
        super.boot();
        this.addHook('beforeCreate', 'ConfigVacationHook.validate');
    }

    getDateStart (value) {
        if (!value) return 
        return moment(value).format('YYYY-MM-DD');
    }

    getDateOver (value) {
        if (!value) return 
        return moment(value).format('YYYY-MM-DD');
    }

    work() {
        return this.belongsTo('App/Models/Work');
    }

    vacations() {
        return this.hasMany('App/Models/Vacation');
    }

}

module.exports = ConfigVacation
