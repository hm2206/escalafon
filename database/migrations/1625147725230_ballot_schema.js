'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BallotSchema extends Schema {
  up () {
    this.create('ballots', (table) => {
      table.increments()
      table.integer('schedule_id').notNullable()
      table.string('ballot_number').notNullable()
      table.enum('motivo', ['FUERA_DE_HORA', 'MOTIVOS_PARTICULARES', 'SALUD', 'COMISION_DE_SERVICIO']).notNullable();
      table.time('time_start');
      table.time('time_over');
      table.time('time_return');
      table.decimal('total', 10, 2);
      table.text('justification')
      table.timestamps()
    })
  }

  down () {
    this.drop('ballots')
  }
}

module.exports = BallotSchema
