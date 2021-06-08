'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ScheduleSchema extends Schema {
  up () {
    this.create('schedules', (table) => {
      table.increments()
      table.integer('info_id').notNullable();
      table.date('date').notNullable();
      table.time('time_start').notNullable();
      table.time('delay_start').notNullable().defaultTo('00:00:00');
      table.time('time_over').notNullable();
      table.time('delay_over').notNullable().defaultTo('00:00:00');
      table.boolean('state').defaultTo(true);
      table.unique(['info_id', 'date', 'time_start', 'time_over']);
      table.timestamps()
    })
  }

  down () {
    this.drop('schedules')
  }
}

module.exports = ScheduleSchema
