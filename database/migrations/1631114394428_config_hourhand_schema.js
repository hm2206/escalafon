'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ConfigHourhandSchema extends Schema {
  up () {
    this.create('config_hourhands', (table) => {
      table.increments()
      table.integer('hourhand_id')
      table.integer('index').notNullable()
      table.time('time_start');
      table.float('delay_start', 8, 2).notNullable().defaultTo('0');
      table.time('time_over');
      table.enum('modo', ['ALL', 'ENTRY', 'EXIT']).defaultTo('ALL')
      table.boolean('state').defaultTo(true)
      table.timestamps()
      table.unique(['hourhand_id', 'index'])
    })
  }

  down () {
    this.drop('config_hourhands')
  }
}

module.exports = ConfigHourhandSchema
