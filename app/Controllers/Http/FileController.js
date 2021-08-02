'use strict'

const { validation, Storage } = require('validator-error-adonis')
const CustomException = require('../../Exceptions/CustomException')
const NotFoundModelException = require('../../Exceptions/NotFoundModelException')
const Helpers = use('Helpers')
const File = use('App/Models/File')
const Drive = use('Drive')
const VerifyFile = require('../../Helpers/VerifyFile')

class FileController {

    allows = [
        'App/Models/Degree',
        'App/Models/Permission',
        'App/Models/License',
        'App/Models/Ascent',
        'App/Models/Displacement',
        'App/Models/Merit',
    ]

    extnames = {
        'App/Models/Degree': ['pdf', 'docx', 'doc'],
        'App/Models/Permission': ['pdf', 'docx', 'doc'],
        'App/Models/License': ['pdf', 'docx', 'doc'],
        'App/Models/Ascent': ['pdf', 'docx', 'doc'],
        'App/Models/Displacement': ['pdf', 'docx', 'doc'],
        'App/Models/Merit': ['pdf', 'docx', 'doc']
    }

    async validateAllow(value) {
        if (!this.allows.includes(value)) throw new CustomException("El tipo de objecto no está permitido") 
    }

    async getAllowExtnames(value) {
        return this.extnames[value] || []
    }

    async getObject(object_type, object_id) {
        try {
            let Imp = use(object_type);
            let obj = await Imp.find(object_id)
            if (!obj) throw new Error("No hay objecto")
            return obj  
        } catch (error) {
            throw new CustomException("No se encontró el objecto")
        }
    }

    async store({ request }) {
        let datos = request.all()
        await validation(null, datos, {
            object_id: 'required',
            object_type: 'required',
        })
        // validar tipo de objecto
        await this.validateAllow(datos.object_type);
        // obtener extnames permitidos
        let extnames = await this.getAllowExtnames(datos.object_type);
        // obtener objecto
        let obj = await this.getObject(datos.object_type, datos.object_id);
        let dir = `dir-${obj.id}`
        let pathBase = `${datos.object_type}`.split('/').pop()
        // validar file
        const verifyFile = new VerifyFile(datos.object_type, obj);
        await verifyFile.handle();
        // subir archivo
        let file = await Storage.saveFile(request, 'file', {
            required: true,
            multifiles: false,
            extnames
        }, Helpers, {
            path: `/${pathBase}/${dir}`.toLowerCase(),
            options: {}
        });
        // validar save
        if (!file.success) throw new CustomException("No se pudó guardar el archivo");
        // generar file db
        try {
            let newFile = await File.create({
                object_id: datos.object_id,
                object_type: datos.object_type,
                name: file.name,
                extname: file.extname,
                size: file.size,
                real_path: file.realPath 
            });
            // response
            return {
                success: true,
                status: 201,
                message: "El archivo se guardó correctamente!",
                file: newFile 
            }
        } catch (error) {
            let exists = await Drive.exists(file.realPath)
            if (exists) await Drive.delete(file.realPath)
            throw new CustomException("no se pudó generar metainformación del archivo")
        }
    }

    async objectType({ params, request }) {
        let object_type = request.input('type', 'App')
        let page = request.input('page', 1)
        let perPage = request.input('perPage', 20)
        let files = await File.query() 
            .setHidden(['token', 'real_path'])
            .where('object_id', params.object_id)
            .where('object_type', object_type)
            .paginate(page, perPage)
        return {
            success: true,
            status: 200,
            files
        }
    }

    async binary({ params, response }) {
        let token = params.token
        let file = await File.findBy('token', token)
        if (!file) throw new NotFoundModelException("El archivo")
        return response.attachment(file.real_path)
    }

}

module.exports = FileController
