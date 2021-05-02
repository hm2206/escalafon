'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BancoSchema extends Schema {
  up () {
    this.create('bancos', (table) => {
      table.increments();
      table.string("nombre").notNullable();
      table.text("descripcion");
      table.timestamps();
    })
  }

  down () {
    this.drop('bancos')
  }
}

module.exports = BancoSchema
