'use strict'

const { Command } = require('@adonisjs/ace')
const SyncScheduleInfosProcedure = require('../Procedures/SyncScheduleInfosProcedure');
const SyncConfigInfoProcedure = require('../Procedures/SyncConfigInfoProcedure')
const PreparateDiscountProcedure = require('../Procedures/PrepareDiscountProcedure');
const CalcDiscountProcedure = require('../Procedures/CalcDiscountProcedure');

class InstallerProcedured extends Command {
  static get signature () {
    return 'installer:procedured'
  }

  static get description () {
    return 'Comando para instalar los procedimientos almacenados a la base de datos'
  }

  async handle (args, options) {
    await SyncScheduleInfosProcedure.up();
    await SyncConfigInfoProcedure.up();
    await PreparateDiscountProcedure.up();
    await CalcDiscountProcedure.up();
    process.exit();
  }
}

module.exports = InstallerProcedured
