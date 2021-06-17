'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PreAssistanceSchema extends Schema {
  up () {
    this.create('pre_assistances', (table) => {
      table.increments()
      table.string('deviceUserId').notNullable();
      table.date('date').notNullable();
      table.time('recordTime').notNullable();
      table.integer('clock_id').notNullable();
      table.timestamps()
    })
  }

  down () {
    this.drop('pre_assistances')
  }
}

module.exports = PreAssistanceSchema
