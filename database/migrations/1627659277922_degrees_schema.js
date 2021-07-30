'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DegreesSchema extends Schema {
  up () {
    this.create('degrees', (table) => {
      table.increments()
      table.integer('work_id').notNullable()
      table.integer('type_degree_id').notNullable()
      table.string('institution').notNullable()
      table.string('document_number').notNullable()
      table.date('date').notNullable()
      table.text('description')
      table.boolean('state').defaultTo(true)
      table.timestamps()
    })
  }

  down () {
    this.drop('degrees')
  }
}

module.exports = DegreesSchema
