'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class HourhandSchema extends Schema {
  up () {
    this.create('hourhands', (table) => {
      table.increments()
      table.string('name').notNullable().unique()
      table.boolean('is_default').notNullable().defaultTo(false)
      table.boolean('state').notNullable().defaultTo(true)
      table.timestamps()
    })
  }

  down () {
    this.drop('hourhands')
  }
}

module.exports = HourhandSchema
