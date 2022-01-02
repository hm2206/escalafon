'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddDescriptionToTypeCargosSchema extends Schema {
  up () {
    this.table('type_cargos', (table) => {
      table.string('description').notNullable();
    })
  }

  down () {
    this.table('type_cargos', (table) => {
      table.dropColumn('description');
    })
  }
}

module.exports = AddDescriptionToTypeCargosSchema
