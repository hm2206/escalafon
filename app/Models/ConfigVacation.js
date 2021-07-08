'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ConfigVacation extends Model {

    info() {
        return this.belongsTo('App/Models/Info');
    }

}

module.exports = ConfigVacation
