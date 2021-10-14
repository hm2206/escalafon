'use strict'

const ConfigVacationHook = exports = module.exports = {}
const moment = require('moment');

ConfigVacationHook.validate = async (configVacation) => {
  const start = moment(configVacation.date_start, 'YYYY-MM-DD');
  const over = moment(configVacation.date_over, 'YYYY-MM-DD');
  const diff = over.diff(start, 'days').valueOf();
  if (diff < 0) throw new Error("Debe ser mayor/igual a cero");
  configVacation.scheduled_days = diff + 1;
}
