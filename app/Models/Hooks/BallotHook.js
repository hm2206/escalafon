'use strict'

const BallotHook = exports = module.exports = {}

const moment = require('moment');
const Schedule = use('App/Models/Schedule');

BallotHook.generateTotal = async (ballot) => {

    let time_start = moment(ballot.time_start, 'HH:mm');
    let time_over = moment(ballot.time_over, 'HH:mm');
    let time_return = moment(ballot.time_return, 'HH:mm');

    let duration = 0;

    if (ballot.modo == 'ENTRY') {
        ballot.time_return = null;
        let schedule = await Schedule.find(ballot.schedule_id);
        let time_schedule = moment(schedule.time_start, 'HH:mm');
        time_schedule = time_schedule.add(schedule.delay_start, 'minutes');
        duration = time_start.diff(time_schedule, 'minutes').valueOf();
    } else {
        ballot.time_start = null;
        duration = time_return.diff(time_over, 'minutes').valueOf();
    }

    ballot.total = duration;
}
