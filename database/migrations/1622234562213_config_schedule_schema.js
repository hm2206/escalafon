'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');
const ConfigSchedule = use('App/Models/ConfigSchedule');

class ConfigScheduleSchema extends Schema {
  up () {
    this.create('config_schedules', (table) => {
      table.increments()
      table.integer('entity_id').notNullable();
      table.string('name').notNullable();
      table.boolean('state').defaultTo(true);
      table.unique(['entity_id', 'name']);
      table.timestamps()
    })
  }

  down () {
    this.drop('config_schedules')
  }
}

module.exports = ConfigScheduleSchema
