'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment')

class Ascent extends Model {

    getDateResolution(value) {
        return value ? moment(value).format('YYYY-MM-DD') : null 
    }

    getDateStart(value) {
        return value ? moment(value).format('YYYY-MM-DD') : null 
    }

    type_categoria() {
        return this.belongsTo('App/Models/TypeCategoria')
    }

}

module.exports = Ascent
