'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ConfigVacation extends Model {

    work() {
        return this.belongsTo('App/Models/Work');
    }

    vacations() {
        return this.hasMany('App/Models/Vacation');
    }

}

module.exports = ConfigVacation
