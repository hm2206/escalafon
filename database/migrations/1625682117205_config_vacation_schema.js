'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ConfigVacationSchema extends Schema {
  up () {
    this.create('config_vacations', (table) => {
      table.increments()
      table.integer('info_id').notNullable();
      table.integer('year').notNullable();
      table.integer('scheduled_days').notNullable();
      table.boolean('state').defaultTo(true);
      table.timestamps()
    })
  }

  down () {
    this.drop('config_vacations')
  }
}

module.exports = ConfigVacationSchema
