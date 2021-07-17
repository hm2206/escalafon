'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddModoBallotsSchema extends Schema {
  up () {
    this.table('ballots', (table) => {
      table.enum('modo', ['ENTRY', 'EXIT']).notNullable();
    })
  }

  down () {
    this.table('ballots', (table) => {
      table.dropColumn('modo');
    })
  }
}

module.exports = AddModoBallotsSchema
