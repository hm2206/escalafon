'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DisplacementSchema extends Schema {
  up () {
    this.create('displacements', (table) => {
      table.increments()
      table.integer('info_id').notNullable()
      table.string('resolution').notNullable()
      table.date('date_resolution').notNullable()
      table.date('date_start').notNullable()
      table.date('date_over')
      table.integer('dependencia_id').notNullable()
      table.integer('perfil_laboral_id').notNullable()
      table.text('description')
      table.boolean('state').defaultTo(true)
      table.timestamps()
    })
  }

  down () {
    this.drop('displacements')
  }
}

module.exports = DisplacementSchema
