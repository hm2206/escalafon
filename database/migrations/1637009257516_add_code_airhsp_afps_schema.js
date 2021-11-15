'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCodeAirhspAfpsSchema extends Schema {
  up () {
    this.table('afps', (table) => {
      table.string('code_airhsp');
    })
  }

  down () {
    this.table('afps', (table) => {
      table.dropColumn('code_airhsp');
    })
  }
}

module.exports = AddCodeAirhspAfpsSchema
