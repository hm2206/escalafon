'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment');

class Permission extends Model {

    static boot () {
        super.boot();
        this.addHook('beforeSave', 'PermissionHook.generateDaysUsed');
    }

    getDateStart(value) {
        return moment(value).format('YYYY-MM-DD');
    }

    getDateOver(value) {
        return moment(value).format('YYYY-MM-DD');
    }

    // relations
    info() {
        return this.belongsTo('App/Models/Info');
    }

    type_permission() {
        return this.belongsTo('App/Models/TypePermission');
    }

}

module.exports = Permission
