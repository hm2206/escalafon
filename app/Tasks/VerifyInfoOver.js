'use strict'

const Task = use('Task');
const Info = use('App/Models/Info');
const moment = require('moment');
const DB = use('Database');

class VerifyInfoOver extends Task {
  static get schedule () {
    return '0 0 0 * * *'
  }

  async disabledInfos () {
    // generar dates
    let old_date = moment().subtract(1, 'month');
    let old_month = old_date.format('M');
    let old_year = old_date.format('Y');
    // obtener contratos
    return await Info.query()
      .where(DB.raw(`(fecha_de_cese is not null AND fecha_de_cese <> '')`))
      .where(DB.raw(`YEAR(fecha_de_cese) = ${old_year}`))
      .where(DB.raw(`MONTH(fecha_de_cese) = ${old_month}`))
      .where('estado', 1)
      .update({ estado: 0 });
  }

  async handle () {
    // validar bucle
    await this.disabledInfos();
  }
  
}

module.exports = VerifyInfoOver
