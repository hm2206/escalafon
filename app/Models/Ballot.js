'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Ballot extends Model {

    schedule() {
        return this.belongsTo('App/Models/Schedule')
    }

}

module.exports = Ballot
