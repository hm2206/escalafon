'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FileSchema extends Schema {
  up () {
    this.create('files', (table) => {
      table.increments()
      table.integer('object_id').notNullable()
      table.string('object_type').notNullable()
      table.string('name').notNullable()
      table.string('extname').notNullable()
      table.integer('size').notNullable()
      table.string('real_path').notNullable().unique()
      table.string('token')
      table.boolean('state').defaultTo(true)
      table.timestamps()
    })
  }

  down () {
    this.drop('files')
  }
}

module.exports = FileSchema
