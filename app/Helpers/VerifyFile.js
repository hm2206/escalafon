'use strict'

const CustomException = require("../Exceptions/CustomException")

const File = use('App/Models/File')

class VerifyFile {

    object_type = ""
    object = null

    constructor(object_type, object) {
        this.object_type = object_type
        this.object = object
    }

    verifyDegree = async () => {
        // verificar que solo tenga un solo archivo
        let existsFile = await File.query()
            .where('object_type', this.object_type)
            .where('object_id', this.object.id)
            .getCount('id');
        if (existsFile > 5) throw new CustomException("Solo se puede tener 5 archivos como máximo")  
    }

    async handle() {

        let listObject = {
            'App/Models/Degree': this.verifyDegree
        }

        let currentVerify = listObject[this.object_type];
        if (typeof currentVerify != 'function') return true;
        return await currentVerify();
    }
        
}

module.exports = VerifyFile