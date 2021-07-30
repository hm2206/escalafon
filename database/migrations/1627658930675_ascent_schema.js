'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AscentSchema extends Schema {
  up () {
    this.create('ascents', (table) => {
      table.increments()
      table.integer('info_id').notNullable()
      table.string('resolution').notNullable()
      table.date('date_resolution').notNullable()
      table.integer('type_categoria_id').notNullable()
      table.date('date_start').notNullable()
      table.text('description')
      table.boolean('state').defaultTo(true)
      table.unique(['info_id', 'resolution'])
      table.timestamps()
    })
  }

  down () {
    this.drop('ascents')
  }
}

module.exports = AscentSchema
