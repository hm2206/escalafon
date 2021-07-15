'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');
const moment = require('moment');

class License extends Model {

    static boot () {
        super.boot();
        this.addHook('beforeSave', 'LicenseHook.generateDaysUsed');
    }

    getDateResolution(value) {
        return moment(value).format('YYYY-MM-DD');
    }
    
    getDateStart(value) {
        return moment(value).format('YYYY-MM-DD');
    }

    getDateOver(value) {
        return moment(value).format('YYYY-MM-DD');
    }

    situacion_laboral() {
        return this.belongsTo('App/Models/SituacionLaboral');
    }

}

module.exports = License
