'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Permission extends Model {

    static boot () {
        super.boot();
        this.addHook('beforeSave', 'PermissionHook.generateDaysUsed');
    }

    // relations
    work() {
        return this.belongsTo('App/Models/Work');
    }

    type_permission() {
        return this.belongsTo('App/Models/TypePermission');
    }

}

module.exports = Permission
