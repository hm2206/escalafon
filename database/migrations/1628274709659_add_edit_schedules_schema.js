'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEditSchedulesSchema extends Schema {
  up () {
    this.table('schedules', (table) => {
      table.integer('discount_log').defaultTo(0)
      table.boolean('is_edited').defaultTo(false)
      table.boolean('is_blocked').defaultTo(false)
    })
  }

  down () {
    this.table('schedules', (table) => {
      table.dropColumn('discount_log')
      table.dropColumn('is_edited')
      table.dropColumn('is_blocked')
    })
  }
}

module.exports = AddEditSchedulesSchema
