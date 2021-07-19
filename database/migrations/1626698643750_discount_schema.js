'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DiscountSchema extends Schema {
  up () {
    this.create('discounts', (table) => {
      table.increments()
      table.integer('info_id').notNullable();
      table.integer('year').notNullable();
      table.integer('month').notNullable();
      table.decimal('base', 10, 2).defaultTo(0);
      table.integer('days').defaultTo(30).notNullable();
      table.integer('hours').defaultTo(8).notNullable();
      table.decimal('discount_min', 10, 2).defaultTo(0);
      table.decimal('discount', 10, 2).defaultTo(0)
      table.boolean('verify').defaultTo(false).notNullable();
      table.boolean('state').defaultTo(true).notNullable();
      table.unique(['info_id', 'year', 'month']);
      table.timestamps()
    })
  }

  down () {
    this.drop('discounts')
  }
}

module.exports = DiscountSchema
