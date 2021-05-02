'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class WorkSchema extends Schema {
  up () {
    this.create('works', (table) => {
      table.increments()
      table.string("person_id").unique();
      table.integer('banco_id').notNullable().defaultTo(1);
      table.string('numero_de_cuenta');
      table.bigInteger('afp_id').defaultTo(1).notNullable();
      table.string('numero_de_cussp');
      table.date('fecha_de_afiliacion');
      table.string("numero_de_essalud");
      table.boolean('prima_seguro', 1).defaultTo(1);
      table.string('code');
      table.string('orden').notNullable();
      table.boolean("estado", 1).defaultTo(1);
    table.timestamps()
    })
  }

  down () {
    this.drop('works')
  }
}

module.exports = WorkSchema
