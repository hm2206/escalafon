'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ScheduleSchema extends Schema {
  up () {
    this.create('schedules', (table) => {
      table.increments()
      table.string('object_type').notNullable();
      table.integer('object_id').notNullable();
      table.integer('index').notNullable();
      table.time('time_start').notNullable();
      table.time('time_over').notNullable();
      table.boolean('state').defaultTo(true);
      table.unique(['object_type', 'object_id', 'index', 'time_start', 'time_over'], 'unique_schedule');
      table.timestamps()
    })
  }

  down () {
    this.drop('schedules')
  }
}

module.exports = ScheduleSchema
