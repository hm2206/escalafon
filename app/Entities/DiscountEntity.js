'use strict';

const DiscountBuilder = require('../Helpers/DiscountBuilder');
const DiscountDetailBuilder = require('../Helpers/DiscountDetailBuilder');


class DiscountEntity {

    constructor(request = null) {
        if (request) {
            this.authentication = request.api_authentication;
            this.auth = request.$auth;
            this.app = request.$app;
            this.method = request.$method;
        }
    }

}

module.exports = DiscountEntity;