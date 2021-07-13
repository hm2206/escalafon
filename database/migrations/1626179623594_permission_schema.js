'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PermissionSchema extends Schema {
  up () {
    this.create('permissions', (table) => {
      table.increments()
      table.integer('type_permission_id').notNullable();
      table.integer('work_id').notNullable();
      table.date('date_start').notNullable();
      table.date('date_over').notNullable();
      table.integer('days_used').notNullable();
      table.enum('option', ['CITT']).notNullable();
      table.string('document_number');
      table.text('justification');
      table.boolean('state').defaultTo(true);
      table.timestamps()
    })
  }

  down () {
    this.drop('permissions')
  }
}

module.exports = PermissionSchema
