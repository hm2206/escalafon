'use strict'

const Task = use('Task');
const Info = use('App/Models/Info');
const moment = require('moment');
const DB = use('Database');

class VerifyInfoOver extends Task {
  static get schedule () {
    return '0 */1 * * * *'
  }

  async getIds () {
    let old_date = moment().subtract(1, 'month');
    let old_month = old_date.format('M');
    let old_year = old_date.format('Y');
    // obtener contratos
    return await Info.query()
      .where(DB.raw(`YEAR(fecha_de_cese) = ${old_year}`))
      .where(DB.raw(`MONTH(fecha_de_cese) = ${old_month}`))
      .where('estado', 1)
      .limit('20')
      .pluck('id');
  }

  async disabledInfos (ids = []) {
    let count = await Info.query()
      .whereIn('id', ids)
      .update({ estado: 0 });
    console.log(`successfull verify-info-over: ${count}`);
  }

  async handle () {
    let ids = await this.getIds();
    await this.disabledInfos(ids);
    // validar bucle
    if (ids.length) await this.handle();
  }
  
}

module.exports = VerifyInfoOver
