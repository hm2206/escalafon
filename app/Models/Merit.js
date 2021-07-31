'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment')

class Merit extends Model {

    getDate(value) {
        return value ? moment(value).format('YYYY-MM-DD') : null
    }

}

module.exports = Merit
