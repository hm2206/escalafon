'use strict'

const moment = require("moment")
const AddHourhandProcedure = require('../Procedures/AddHourhandProcedure')

const Task = use('Task')

class AddSchedulesMonthly extends Task {
  static get schedule () {
    return '0 0 0 * * *'
  }

  async handle () {
    let limit = 31;
    let current_date = moment();

    for(let index = 1; index <= limit; index++) {
      let date = moment(`${current_date.year()}-${current_date.month() + 1}-${index}`, 'YYYY-MM-DD')
      if (await !date.isValid()) continue;
      let date_string = `${date.format('YYYY-MM-DD')}`
      let date_index = date.days();
      try {
        await AddHourhandProcedure.call({ date: date_string, index: date_index })
        console.log(`success: ${date_string}`)
      } catch (error) {
        console.log(`error: ${date_string}`)
      }
    }
  }
}

module.exports = AddSchedulesMonthly
