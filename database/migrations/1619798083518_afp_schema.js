'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AfpSchema extends Schema {
  up () {
    this.create('afps', (table) => {
      table.increments()
      table.integer('afp_id').notNullable();
      table.string("afp").notNullable();
      table.integer("type_afp_id").notNullable();
      table.string("type_afp").notNullable();
      table.integer("type_descuento_id").defaultTo(0);
      table.decimal('porcentaje', 12, 2).defaultTo(0);
      table.integer('aporte_descuento_id').defaultTo(0);
      table.decimal('aporte', 12, 2).defaultTo(0);
      table.integer('prima_descuento_id').defaultTo(0);
      table.decimal('prima', 12, 2).defaultTo(0);
      table.decimal('prima_limite', 12, 2).defaultTo(0);
      table.boolean('private').defaultTo(0);
      table.boolean('estado').defaultTo(1);
      table.timestamps()
      table.unique(['afp_id', 'type_afp_id']);
    })
  }

  down () {
    this.drop('afps')
  }
}

module.exports = AfpSchema
