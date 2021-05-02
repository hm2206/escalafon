'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InfoSchema extends Schema {
  up () {
    this.create('infos', (table) => {
      table.increments()
      table.bigInteger('work_id').notNullable();
      table.bigInteger('entity_id').notNullable();
      table.bigInteger('planilla_id').notNullable();
      table.bigInteger('cargo_id').notNullable();
      table.bigInteger('type_categoria_id').notNullable();
      table.bigInteger('meta_id').notNullable();
      table.string('plaza');
      table.bigInteger('dependencia_id').defaultTo(1);
      table.bigInteger('perfil_laboral_id').defaultTo(1);
      table.bigInteger('situacion_laboral_id').defaultTo(1);
      table.string('ruc');
      table.enum("pap", ["CONTRATADO", "NOMBRADO", "CONCURSO", "CAS", "PENSIONISTA", "SUPLENTE", "OTRO"]).defaultTo('OTRO');
      table.string('resolucion');
      table.string('fecha_de_resolucion');
      table.date("fecha_de_ingreso").notNullable();
      table.date("fecha_de_cese");
      table.text('observacion');
      table.string('file');
      table.boolean('is_pay').defaultTo(1);
      table.boolean('estado').defaultTo(1);
      table.timestamps()
    })
  }

  down () {
    this.drop('infos')
  }
}

module.exports = InfoSchema
