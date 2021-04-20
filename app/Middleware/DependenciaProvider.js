'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const { getResponseError } = require('../Services/response');
const CustomException = require('../Exceptions/CustomException');

class DependenciaProvider {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, response }, next) {
    try {
      // get DependenciaID
      let dependenciaId = request.header('DependenciaId');
      if (!dependenciaId) throw new Error('La cabezera DependenciaId es obligatoria');
      // get dependencia
      let { success, message, code, status, dependencia } = await request.api_authentication.get(`auth/dependencia/${request.$entity.id}/${dependenciaId}`)
        .then(res => res.data)
        .catch(err => {
          let { data } = err.response;
          return {
            success: false,
            status: data.status || 404,
            code: data.code || 'ERR_DEPENDENCIA',
            message: data.message || err.message
          }
        });
      // validar dependecia
      if (!success) throw new CustomException(message, code, status);
      // add depedencia at ctx
      request.$dependencia = dependencia;
      // call next to advance the request
      await next()
    } catch (error) {
      return getResponseError(response, error, 'ERR_DEPENDENCIA')
    }
  }
}

module.exports = DependenciaProvider
