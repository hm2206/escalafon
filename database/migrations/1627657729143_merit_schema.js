'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MeritSchema extends Schema {
  up () {
    this.create('merits', (table) => {
      table.increments()
      table.integer('info_id').notNullable()
      table.date('date').notNullable()
      table.string('title').notNullable()
      table.enum('modo', ['MERIT', 'DEMERIT'])
      table.text('description')
      table.boolean('state').defaultTo(true)
      table.timestamps()
    })
  }

  down () {
    this.drop('merits')
  }
}

module.exports = MeritSchema
