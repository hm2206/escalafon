'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PlanillaSchema extends Schema {
  up () {
    this.create('planillas', (table) => {
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('planillas')
  }
}

module.exports = PlanillaSchema
