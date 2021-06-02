'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const DB = use('Database');

const objectTypes = {
    info: 'App/Models/Info',
    config_schedule: 'App/Models/ConfigSchedule',
} 

class Schedule extends Model {

    // relactions
    info () {
        return this.belongsTo(objectTypes.info, 'object_id', 'id')
    }

    config_schedule () {
        return this.belongsTo(objectTypes.config_schedule, 'object_id', 'id');
    }

}

module.exports = Schedule
