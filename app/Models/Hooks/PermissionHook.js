'use strict'

const PermissionHook = exports = module.exports = {}

const moment = require('moment');

PermissionHook.generateDaysUsed = async (permission) => {
    let date_start = moment(permission.date_start);
    let date_over = moment(permission.date_over);
    let duration = date_over.diff(date_start, 'days') + 1;
    permission.days_used = duration;
}
