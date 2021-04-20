'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const CustomException = require('../Exceptions/CustomException');
const NotFoundModelException = require('../Exceptions/NotFoundModelException');
const { getResponseError } = require('../Services/response');
const Group = use('App/Models/Group');
const DB = use('Database');

class GroupProvider {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, response }, next) {
    try {
      let groupId = request.header('GroupId', '');
      let type = request.input('type', 'id');
      let auth = request.$auth;
      if (!groupId) throw new CustomException('El GroupId es requerido', 'GROUP_ID', 401);
      let group = await Group.query()
        .where('user_id', auth.id)
        .where(type, groupId)
        .first()
      if (!group) throw new NotFoundModelException('El grupo');
      request.$group = group;
      // call next to advance the request
      await next()
    } catch (error) {
      return getResponseError(response, error);
    }
  }
}

module.exports = GroupProvider
