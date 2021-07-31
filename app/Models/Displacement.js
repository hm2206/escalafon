'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment')

class Displacement extends Model {

    getDateResolution(value) {
        return value ? moment(value).format('YYYY-MM-DD') : null
    }

    getDateStart(value) {
        return value ? moment(value).format('YYYY-MM-DD') : null
    }

    getDateOver(value) {
        return value ? moment(value).format('YYYY-MM-DD') : null
    }

}

module.exports = Displacement
