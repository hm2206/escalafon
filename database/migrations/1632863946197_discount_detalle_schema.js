'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DiscountDetalleSchema extends Schema {
  up () {
    this.create('discount_detalles', (table) => {
      table.increments()
      table.integer('descuento_id').notNullable();
      table.integer('discount_id').notNullable();
      table.string('description');
      table.boolean('state').defaultTo(true).notNullable();
      table.timestamps()
    })
  }

  down () {
    this.drop('discount_detalles')
  }
}

module.exports = DiscountDetalleSchema
