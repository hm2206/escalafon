'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ConfigSchedule extends Model {

    schedules () {
        return this.hasMany('App/Models/Schedule', 'id', 'object_id');
    }
        
}

module.exports = ConfigSchedule
