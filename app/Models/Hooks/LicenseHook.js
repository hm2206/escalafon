'use strict'

const LicenseHook = exports = module.exports = {}

const moment = require('moment');

LicenseHook.generateDaysUsed = async (license) => {
    let date_start = moment(license.date_start);
    let date_over = moment(license.date_over);
    let duration = date_over.diff(date_start, 'days') + 1;
    license.days_used = duration;
}
