'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddObservationConfigVacationSchema extends Schema {
  up () {
    this.table('config_vacations', (table) => {
      table.string('observation');
    })
  }

  down () {
    this.table('config_vacations', (table) => {
      table.dropColumn('observation');
    })
  }
}

module.exports = AddObservationConfigVacationSchema
