'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Assistance extends Model {

    schedule() {
        return this.belongsTo('App/Models/Schedule')
    }

}

module.exports = Assistance
