'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIsAppliedBallotsSchema extends Schema {
  up () {
    this.table('add_is_applied_ballots', (table) => {
      table.boolean('is_applied').defaultTo(true);
    })
  }

  down () {
    this.table('add_is_applied_ballots', (table) => {
      table.dropColumn('is_applied');
    })
  }
}

module.exports = AddIsAppliedBallotsSchema
