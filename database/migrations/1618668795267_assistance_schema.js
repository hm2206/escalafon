'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AssistanceSchema extends Schema {
  up () {
    this.create('assistances', (table) => {
      table.increments()
      table.integer('entity_id').notNullable();
      table.integer('work_id').notNullable();
      table.integer('clock_id');
      table.dateTime('record_time').notNullable();
      table.enum('status', ['ENTRY', 'EXIT']);
      table.unique(['work_id', 'record_time']);
      table.timestamps()
    })
  }

  down () {
    this.drop('assistances')
  }
}

module.exports = AssistanceSchema
