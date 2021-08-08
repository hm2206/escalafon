'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddDateResolutionMeritSchema extends Schema {
  up () {
    this.table('merits', (table) => {
      table.string('resolution');
      table.date('date_resolution');
    })
  }

  down () {
    this.table('merits', (table) => {
      table.dropColumn('resolution')
      table.dropColumn('date_resolution')
    })
  }
}

module.exports = AddDateResolutionMeritSchema
