'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Work extends Model {

    banco () {
        return this.belongsTo('App/Models/Banco');
    }

    afp () {
        return this.belongsTo('App/Models/Afp');
    }

}

module.exports = Work
