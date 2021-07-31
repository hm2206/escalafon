'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment')

class Degree extends Model {

    getDate(value) {
        return value ? moment(value).format('YYYY-MM-DD') : null 
    }

    type_degree() {
        return this.belongsTo('App/Models/TypeDegree')
    }

}

module.exports = Degree
