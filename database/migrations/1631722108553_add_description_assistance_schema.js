'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddDescriptionAssistanceSchema extends Schema {
  up () {
    this.table('assistances', (table) => {
      table.text('description');
    })
  }

  down () {
    this.table('assistances', (table) => {
      table.dropColumn('description')
    })
  }
}

module.exports = AddDescriptionAssistanceSchema
