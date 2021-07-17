'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Ballot extends Model {
    
    static boot () {
        super.boot();
        this.addHook('beforeSave', 'BallotHook.generateTotal');
    }

    schedule() {
        return this.belongsTo('App/Models/Schedule')
    }

}

module.exports = Ballot
