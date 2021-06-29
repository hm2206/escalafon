'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AssistanceSchema extends Schema {
  up () {
    this.create('assistances', (table) => {
      table.increments()
      table.integer('schedule_id').notNullable();
      table.integer('clock_id');
      table.time('record_time').notNullable();
      table.decimal('delay', 10, 2).notNullable().defaultTo(0).comment("Tardanza en minutos");
      table.decimal('extra', 10, 2).notNullable().defaultTo(0).comment("Horas extras en minutos")
      table.enum('status', ['ENTRY', 'EXIT']);
      table.boolean('state').defaultTo(true);
      table.unique(['schedule_id', 'record_time'], 'unique_assistances');
      table.timestamps();
    })
  }

  down () {
    this.drop('assistances')
  }
}

module.exports = AssistanceSchema
