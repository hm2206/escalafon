'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddMontoDiscountDetallesSchema extends Schema {
  up () {
    this.table('discount_detalles', (table) => {
      table.double('monto', 10, 2).notNullable().defaultTo(0)
      table.unique(['descuento_id', 'discount_id'])
    })
  }

  down () {
    this.table('discount_detalles', (table) => {
      table.dropColumn('monto');
      table.dropUnique(['descuento_id', 'discount_id'])
    })
  }
}

module.exports = AddMontoDiscountDetallesSchema
