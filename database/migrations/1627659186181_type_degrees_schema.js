'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TypeDegreesSchema extends Schema {
  up () {
    this.create('type_degrees', (table) => {
      table.increments()
      table.string('name').notNullable()
      table.string('description').notNullable()
      table.boolean('state').defaultTo(true)
      table.timestamps()
    })
  }

  down () {
    this.drop('type_degrees')
  }
}

module.exports = TypeDegreesSchema
