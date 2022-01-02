'use strict'
const HourBand = use('App/Models/Hourhand');

class HourhandController {
  async index({ request }) {
    const page = request.input('page');
    const hourhand = await HourBand.query().paginate(page, 20);
    return {
      success: true,
      hourhand
    }
  }
}

module.exports = HourhandController
