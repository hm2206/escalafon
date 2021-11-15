'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCodeAirhspInfosSchema extends Schema {
  up () {
    this.table('infos', (table) => {
      table.string('code_airhsp');
    })
  }

  down () {
    this.table('infos', (table) => {
      table.dropColumn('code_airhsp');
    })
  }
}

module.exports = AddCodeAirhspInfosSchema
