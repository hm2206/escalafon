'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const { getResponseError } = require('../Services/response');
const View = use('View');

class EntityProvider {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, response }, next) {
    try {
      // get entityId
      let id = await this.getEntityId(request);
      if (!id) throw new Error("La cabezera EntityID es obligatoria");
      // validar entity
      let { entity, success, message } = await request.api_authentication.get(`auth/entity/${id}`)
      .then(res => ({ entity: res.data, success: true }))
      .catch(err => {
        if (typeof err.response == 'object') {
          let { data } = err.response;
          if (typeof data != 'object') return { success: false, message: err.message };
          return { success: false, message: data.message };
        } 
        return { success: false, message: err.message };
      });
      if (!success) throw new Error(message);
      // inject entity
      request.$entity = entity;
      // global views
      View.global('$entity', request.$entity);
      // call next to advance the request
      await next()
    } catch (error) {
      return getResponseError(response, error, 'ERR_ENTITY_ID');
    }
  }

  getEntityId = (request) => {
    return request.header('EntityId') || request.input('EntityId');
  }

}

module.exports = EntityProvider
