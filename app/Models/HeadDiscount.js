'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment');

class HeadDiscount extends Model {

    getDate(value) {
        return moment(value, 'YYYY-MM-DD').format('YYYY-MM-DD');
    }

}

module.exports = HeadDiscount
