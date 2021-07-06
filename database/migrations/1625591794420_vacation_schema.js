'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VacationSchema extends Schema {
  up () {
    this.create('vacations', (table) => {
      table.increments()
      table.integer('info_id').notNullable();
      table.integer('config_vacation_id').notNullable();
      table.date('date_start').notNullable();
      table.date('date_over').notNullable();
      table.integer('count_days').notNullable();
      table.boolean('state').defaultTo(true).notNullable();
      table.timestamps()
    })
  }

  down () {
    this.drop('vacations')
  }
}

module.exports = VacationSchema
