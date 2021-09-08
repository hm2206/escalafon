'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddHourhandToInfoSchema extends Schema {
  up () {
    this.table('infos', (table) => {
      table.integer('hourhand_id');
    })
  }

  down () {
    this.table('infos', (table) => {
      table.dropColumn('hourhand_id')
    })
  }
}

module.exports = AddHourhandToInfoSchema
