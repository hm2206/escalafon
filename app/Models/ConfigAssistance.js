'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');
const moment = require('moment');

class ConfigAssistance extends Model {

    getDate (value) {
        if (!value) return 
        return moment(value).format('YYYY-MM-DD');
    }

}

module.exports = ConfigAssistance
