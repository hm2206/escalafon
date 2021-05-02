'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SituacionLaboralSchema extends Schema {
  up () {
    this.create('situacion_laborals', (table) => {
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('situacion_laborals')
  }
}

module.exports = SituacionLaboralSchema
