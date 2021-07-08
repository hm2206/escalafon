'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Vacation extends Model {

    static boot () {
        super.boot();
        this.addHook('beforeSave', 'VacationHook.addDaysUsed');
    }

}

module.exports = Vacation
