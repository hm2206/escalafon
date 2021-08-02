'use strict'

const FileHook = exports = module.exports = {}
const ObjectID = require("bson-objectid")

FileHook.generateToken = async (file) => {
    let token = await ObjectID();
    file.token = token.toHexString();
}
