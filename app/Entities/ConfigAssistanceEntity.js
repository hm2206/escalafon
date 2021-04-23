'use strict';

const ConfigAssistance = use('App/Models/ConfigAssistance');
const DBException = require('../Exceptions/DBException');
const { validation } = require('validator-error-adonis');
const { validateAll } = use('Validator');
const moment = require('moment');

class ConfigAssistanceEntity {

    async store (datos = {}) {
        await validation(validateAll, datos, {
            entity_id: 'required',
            date: 'required|dateFormat:YYYY-MM-DD'
        });
        // obtener fecha
        let index = moment(datos.date).day();
        let payload = {
            entity_id: datos.entity_id,
            index,
            date: datos.date
        }
        // guardar datos
        try {
            return await ConfigAssistance.create(payload);
        } catch (error) {
            throw new DBException(error);
        }
    }

}

module.exports = ConfigAssistanceEntity;