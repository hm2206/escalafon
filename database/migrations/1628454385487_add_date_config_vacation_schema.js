'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddDateConfigVacationSchema extends Schema {
  up () {
    this.table('config_vacations', (table) => {
      table.date('date_start').notNullable().defaultTo('2021-09-10')
      table.date('date_over').notNullable().defaultTo('2021-09-10')
    })
  }

  down () {
    this.table('config_vacations', (table) => {
      table.dropColumn('date_start')
      table.dropColumn('date_over')
    })
  }
}

module.exports = AddDateConfigVacationSchema
