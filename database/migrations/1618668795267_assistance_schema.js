'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AssistanceSchema extends Schema {
  up () {
    this.create('assistances', (table) => {
      table.increments()
      table.integer('config_assistance_id').notNullable();
      table.integer('work_id').notNullable();
      table.integer('clock_id');
      table.time('record_time').notNullable();
      table.float('delay', 2).notNullable().defaultTo(0).comment("Tardanza en minutos");
      table.enum('status', ['ENTRY', 'EXIT']);
      table.unique(['config_assistance_id', 'work_id', 'record_time'], 'config_unique_assistances');
      table.timestamps();
    })
  }

  down () {
    this.drop('assistances')
  }
}

module.exports = AssistanceSchema
