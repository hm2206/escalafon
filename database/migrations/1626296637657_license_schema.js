'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class LicenseSchema extends Schema {
  up () {
    this.create('licenses', (table) => {
      table.increments()
      table.integer('entity_id').notNullable();
      table.integer('work_id').notNullable();
      table.integer('situacion_laboral_id').notNullable();
      table.string('resolution').notNullable();
      table.date('date_resolution').notNullable();
      table.date('date_start').notNullable();
      table.date('date_over').notNullable();
      table.integer('days_used').notNullable();
      table.string('description').notNullable();
      table.boolean('is_pay').defaultTo(false);
      table.boolean('state').defaultTo(true);
      table.timestamps()
    })
  }

  down () {
    this.drop('licenses')
  }
}

module.exports = LicenseSchema
