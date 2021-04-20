'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const NotAuthenticateException = require('../Exceptions/NotAuthenticateException')
const { getResponseError } = require('../Services/response');
const View = use('View');

class Jwt {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, response }, next) {
    try {
    // obtener auth
    let { success, message, user } = await request.api_authentication.get(`me?method=${request.$method}`)
      .then(res => res.data)
      .catch(err => {
        let { data } = err.response;
        return ({
          success: false,
          status: data.status || 401,
          code: err.code || 'ERR_AUTHORIZATION',
          user: {},
          message: data.message || err.message
        })
      });
      // validar auth
      if (success == false) throw new NotAuthenticateException(message)
      // add auth in ctx
      request.$auth = user;
      // config global view
      View.global('$auth', request.$auth);
      // call next to advance the request
      await next()
    } catch (error) {
      return getResponseError(response, error, 'ERR_JWT')
    }
  }
}

module.exports = Jwt
