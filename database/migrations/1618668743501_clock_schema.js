'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ClockSchema extends Schema {
  up () {
    this.create('clocks', (table) => {
      table.increments()
      table.string('entity_id');
      table.string('name').unique();
      table.string('host').notNullable();
      table.string('port').notNullable();
      table.timestamps()
    })
  }

  down () {
    this.drop('clocks')
  }
}

module.exports = ClockSchema
