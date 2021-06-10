'use strict'

const { Command } = require('@adonisjs/ace')
const SyncScheduleInfosProcedure = require('../Procedures/SyncScheduleInfosProcedure');

class InstallerProcedured extends Command {
  static get signature () {
    return 'installer:procedured'
  }

  static get description () {
    return 'Comando para instalar los procedimientos almacenados a la base de datos'
  }

  async handle (args, options) {
    await SyncScheduleInfosProcedure.up();
    process.exit();
  }
}

module.exports = InstallerProcedured
