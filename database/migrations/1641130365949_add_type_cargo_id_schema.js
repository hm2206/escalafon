'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTypeCargoIdSchema extends Schema {
  up () {
    this.table('infos', (table) => {
      table.integer('type_cargo_id').notNullable();
      table.string('code');
    });
  }

  down () {
    this.table('infos', (table) => {
      table.dropColumn('type_cargo_id');
      table.dropColumn('code');
    });
  }
}

module.exports = AddTypeCargoIdSchema;
