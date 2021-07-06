'use strict'

const SyncConfigInfoProcedure = require('../../Procedures/SyncConfigInfoProcedure');

const InfoHook = exports = module.exports = {}

InfoHook.syncConfig = async (info) => {
    await SyncConfigInfoProcedure.call({ info_id: info.id });
}
