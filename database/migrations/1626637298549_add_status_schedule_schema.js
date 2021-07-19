'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddStatusScheduleSchema extends Schema {
  up () {
    this.table('schedules', (table) => {
      table.enum('status', ['A', 'F', 'D']).defaultTo('D');
      table.decimal('discount', 10, 2).defaultTo(0);
    })
  }

  down () {
    this.table('schedules', (table) => {
      table.dropColumn('status');
      table.dropColumn('discount');
    })
  }
}

module.exports = AddStatusScheduleSchema
