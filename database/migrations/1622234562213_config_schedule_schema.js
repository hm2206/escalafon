'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ConfigScheduleSchema extends Schema {
  up () {
    this.create('config_schedules', (table) => {
      table.increments()
      table.string('name').notNullable();
      table.boolean('state').defaultTo(true);
      table.timestamps()
    })
  }

  down () {
    this.drop('config_schedules')
  }
}

module.exports = ConfigScheduleSchema
