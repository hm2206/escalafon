'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddConfigDiscountSchema extends Schema {
  up () {
    this.table('discounts', (table) => {
      table.integer('config_discount_id');
      table.dropColumn('year');
      table.dropColumn('month');
      table.dropUnique(['info_id', 'year', 'month'])
      table.unique(['info_id', 'config_discount_id']);
    })
  }

  down () {
    this.table('discounts', (table) => {
      table.dropColumn('config_discount_id');
      table.integer('year').notNullable();
      table.integer('month').notNullable();
      table.unique(['info_id', 'year', 'month'])
      table.dropUnique(['info_id', 'config_discount_id'])
    })
  }
}

module.exports = AddConfigDiscountSchema
