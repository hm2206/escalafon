'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VacationSchema extends Schema {
  up () {
    this.create('vacations', (table) => {
      table.increments()
      table.integer('config_vacation_id').notNullable();
      table.date('date_start').notNullable();
      table.date('date_over').notNullable();
      table.integer('days_used').notNullable();
      table.text('observation')
      table.boolean('state').defaultTo(true).notNullable();
      table.timestamps()
    })
  }

  down () {
    this.drop('vacations')
  }
}

module.exports = VacationSchema
