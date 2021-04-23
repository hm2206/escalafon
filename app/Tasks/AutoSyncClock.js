'use strict'

const Task = use('Task');
const Clock = use('App/Models/Clock');
const moment = require('moment');

class AutoSyncClock extends Task {
  static get schedule () {
    return '0 0 23 * * *'
  }

  async handle () {
    let entities = await Clock.query()
      .groupBy('entity_id')
      .select('entity_id')
      .fetch();
    entities = await entities.toJSON();
    console.log(JSON.stringify(entities));
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'));
  }
}

module.exports = AutoSyncClock
