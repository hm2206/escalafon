'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPlaceForDegreesSchema extends Schema {
  up () {
    this.table('degrees', (table) => {
      table.string('place').notNullable().defaultTo('S/D');
    })
  }

  down () {
    this.table('degrees', (table) => {
      table.dropColumn('place');
    })
  }
}

module.exports = AddPlaceForDegreesSchema
