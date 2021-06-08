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
      table.time('time_start').notNullable();
      table.float('delay_start').notNullable().defaultTo('0');
      table.time('time_over').notNullable();
      table.float('delay_over').notNullable().defaultTo('0');
      table.text('observation');
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
