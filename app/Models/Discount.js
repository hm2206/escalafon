'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Discount extends Model {

    config_discount() {
        return this.belongsTo('App/Models/ConfigDiscount')
    }

    descuentos() {
        return this.belongsToMany('App/Models/Descuento')
            .pivotTable('discount_detalles')
    }

}

module.exports = Discount
