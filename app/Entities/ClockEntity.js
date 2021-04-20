'use strict';

const Clock = use('App/Models/Clock');

const default_payload = { name: "", host: "", port: 4370 }

class ClockEntity {

    store (payload = default_payload) {
        return Clock.create(payload);
    }

}

module.exports = ClockEntity;