'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const { getResponseError } = require('../Services/response');
const SystemException = require('../Exceptions/SystemException');
const View = use('View');
const Env = use('Env');
const moment = require('moment');
moment.locale('es');

class SystemProvider {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, response }, next) {
    try {
      // validar systema
      let { data } = await request.api_authentication.get('system/auth/me');
      if (!data.success) throw new SystemException(data.message);
      request.$system = data.system;
      // global views
      View.global('link', Env.get('APP_URL', ''));
      View.global('$system', request.$system);
      View.global('moment', moment);
      // next request
      return await next(request)
    } catch (error) {
      return getResponseError(response, error);
    }
  }
}

module.exports = SystemProvider
