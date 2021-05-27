'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SelectClockAddStatusSchema extends Schema {
  up () {
    this.table('clocks', (table) => {
      table.boolean('sync').defaultTo(false);
      table.boolean('state').defaultTo(true);
    })
  }

  down () {
    this.table('clocks', (table) => {
      table.dropColumn('sync');
      table.dropColumn('state');
    })
  }
}

module.exports = SelectClockAddStatusSchema
