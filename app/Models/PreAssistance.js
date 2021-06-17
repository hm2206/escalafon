'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment');

class PreAssistance extends Model {

    getDate(value) {
        return moment(value).format('YYYY-MM-DD');
    }

}

module.exports = PreAssistance
