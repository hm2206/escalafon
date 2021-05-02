'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Info extends Model {

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

}

module.exports = Info
