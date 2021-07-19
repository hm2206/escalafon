'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ScheduleSchema extends Schema {
  up () {
    this.create('schedules', (table) => {
      table.increments()
      table.integer('info_id').notNullable();
      table.integer('index').notNullable();
      table.date('date').notNullable();
      table.time('time_start');
      table.float('delay_start', 8, 2).notNullable().defaultTo('0');
      table.time('time_over');
      table.text('observation');
      table.enum('modo', ['ALL', 'ENTRY', 'EXIT']).defaultTo('ALL')
      table.boolean('state').defaultTo(true);
      table.unique(['info_id', 'index', 'date', 'time_start', 'time_over'], 'unique_schedule_info');
      table.timestamps()
    })
  }

  down () {
    this.drop('schedules')
  }
}

module.exports = ScheduleSchema
