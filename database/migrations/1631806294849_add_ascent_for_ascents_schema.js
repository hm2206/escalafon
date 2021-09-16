'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddAscentForAscentsSchema extends Schema {
  up () {
    this.table('ascents', (table) => {
      table.string('ascent').notNullable().defaultTo('S/D')
    })
  }

  down () {
    this.table('ascents', (table) => {
      table.dropColumn('ascent')
    })
  }
}

module.exports = AddAscentForAscentsSchema
