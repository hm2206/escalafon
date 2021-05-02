'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TypeCategoriaSchema extends Schema {
  up () {
    this.create('type_categorias', (table) => {
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('type_categorias')
  }
}

module.exports = TypeCategoriaSchema
