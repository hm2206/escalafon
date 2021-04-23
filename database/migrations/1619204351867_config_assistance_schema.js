'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ConfigAssistanceSchema extends Schema {
  up () {
    this.create('config_assistances', (table) => {
      table.increments();
      table.integer('entity_id').notNullable();
      table.integer('index').notNullable();
      table.date('date').notNullable();
      table.unique(['entity_id', 'date']);
      table.timestamps();
    })
  }

  down () {
    this.drop('config_assistances')
  }
}

module.exports = ConfigAssistanceSchema
