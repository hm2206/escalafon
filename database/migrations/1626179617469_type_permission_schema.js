'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TypePermissionSchema extends Schema {
  up () {
    this.create('type_permissions', (table) => {
      table.increments()
      table.integer('entity_id').notNullable();
      table.string('description').notNullable().unique();
      table.integer('day_of_year').defaultTo(0);
      table.boolean('state').defaultTo(true);
      table.timestamps()
    })
  }

  down () {
    this.drop('type_permissions')
  }
}

module.exports = TypePermissionSchema
