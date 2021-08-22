'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ConfigDiscountSchema extends Schema {
  up () {
    this.create('config_discounts', (table) => {
      table.increments()
      table.integer('entity_id').notNullable();
      table.integer('year').notNullable();
      table.integer('month').notNullable();
      table.text('observation');
      table.enum('status', ['START', 'VERIFIED', 'ACCEPTED', 'EXECUTED']).defaultTo('START').notNullable();
      table.unique(['year', 'month'])
      table.timestamps()
    })
  }

  down () {
    this.drop('config_discounts')
  }
}

module.exports = ConfigDiscountSchema
