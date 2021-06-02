'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddConfigScheduleInfosSchema extends Schema {
  up () {
    this.table('infos', (table) => {
      table.integer('config_schedule_id').notNullable();
    })
  }

  down () {
    this.table('infos', (table) => {
      table.dropColumn('config_schedule_id');
    })
  }
}

module.exports = AddConfigScheduleInfosSchema
