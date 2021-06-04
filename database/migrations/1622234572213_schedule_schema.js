'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ScheduleSchema extends Schema {
  up () {
    this.create('schedules', (table) => {
      table.increments()
      table.integer('config_assistance_id').notNullable(); 
      table.time('time_start').notNullable();
      table.time('time_over').notNullable();
      table.boolean('state').defaultTo(true);
      table.unique(['config_assistance_id', 'time_start', 'time_over']);
      table.timestamps()
    })
  }

  down () {
    this.drop('schedules')
  }
}

module.exports = ScheduleSchema
