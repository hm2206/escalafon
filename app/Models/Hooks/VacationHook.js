'use strict'

const moment = require('moment');

const VacationHook = exports = module.exports = {}

VacationHook.addDaysUsed = async (vacation) => {
    // config date
    let date_start = moment(vacation.date_start);
    let date_over = moment(vacation.date_over);
    let duration = date_over.diff(date_start, 'days').valueOf();
    vacation.days_used = duration > 0 ? duration + 1 : 0;
}
