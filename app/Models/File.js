'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const { URL } = require('../../utils')
const byteSize = require('byte-size')

class File extends Model {

    static boot () {
        super.boot();
        this.addHook('beforeCreate', 'FileHook.generateToken');
    }

    static get computed() {
        return ['url', 'displaySize']
    }

    getUrl() {
        return URL(`api/files/${this.token}/binary`)
    }

    getDisplaySize() {
        return `${byteSize(this.size)}`
    }

}

module.exports = File
