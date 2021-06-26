'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const DB = use('Database');
const moment = require('moment');

class Schedule extends Model {

    getDate (value) {
        return moment(value).format('YYYY-MM-DD');
    }

    assistances() {
        return this.hasMany('App/Models/Assistance')
    }

}

module.exports = Schedule
