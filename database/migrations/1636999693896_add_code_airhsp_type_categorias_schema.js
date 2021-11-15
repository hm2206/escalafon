'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCodeAirhspTypeCategoriasSchema extends Schema {
  up () {
    this.table('type_categorias', (table) => {
      table.string('code_airhsp');
    })
  }

  down () {
    this.table('type_categorias', (table) => {
      table.dropColumn('code_airhsp');
    })
  }
}

module.exports = AddCodeAirhspTypeCategoriasSchema
