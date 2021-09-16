'use strict'

const { validation } = require('validator-error-adonis')
const CustomException = require('../../Exceptions/CustomException')
const Ascent = use('App/Models/Ascent')
const NotFoundModelException = require('../../Exceptions/NotFoundModelException')

class AscentController {

    async store({ request }) {
        // validar inputs
        let datos = request.all()
        await validation(null, datos, {
            info_id: 'required',
            resolution: 'required|max:255',
            date_resolution: 'required|dateFormat:YYYY-MM-DD',
            ascent: 'required|max:255',
            type_categoria_id: 'required',
            date_start: 'required|dateFormat:YYYY-MM-DD',
            description: 'max:1000',
        });
        // crear regístro
        try {
            let ascent = await Ascent.create({
                info_id: datos.info_id,
                resolution: datos.resolution,
                date_resolution: datos.date_resolution,
                ascent: datos.ascent,
                date_start: datos.date_start,
                type_categoria_id: datos.type_categoria_id,
                description: datos.description,
            });
            // response
            return {
                success: true,
                status: 201,
                message: "Los datos se guardarón correctamente!",
                ascent
            }
        } catch (error) {
            throw new CustomException("No se pudó guardar los datos");
        }
    }

    async update({ params, request }) {
        // obtener ascento
        let ascent = await Ascent.find(params.id)
        if (!ascent) throw new NotFoundModelException("El ascenso")
        let datos = request.all()
        // validar datos
        await validation(null, datos, {
            resolution: 'required|max:255',
            date_resolution: 'required|dateFormat:YYYY-MM-DD',
            ascent: 'required|max:255',
            type_categoria_id: 'required',
            date_start: 'required|dateFormat:YYYY-MM-DD',
            description: 'max:1000',
        });
        // procesar
        try {
            // preparar cambios
            ascent.merge({ 
                resolution: datos.resolution,
                date_resolution: datos.date_resolution,
                ascent: datos.ascent,
                type_categoria_id: datos.type_categoria_id,
                date_start: datos.date_start,
                description: datos.description
            })
            await ascent.save()
            ascent.type_categoria = await ascent.type_categoria().fetch();
            // response
            return {
                success: true,
                status: 201,
                message: "Los cambios se guardarón correctamente!",
                ascent
            }
        } catch (error) {
            throw new CustomException("No se pudo guardar los cambios")
        }
    }

    async delete({ params }) {
        let ascent = await Ascent.find(params.id) 
        if (!ascent) throw new NotFoundModelException("El ascenso")
        try {
            // eliminar ascenso
            await ascent.delete()
            return {
                success: true,
                status: 201,
                message: "El ascenso se elimnó correctamente"
            }
        } catch (error) {
            throw new CustomException("No se pudó eliminar el ascenso")
        }
    }

}

module.exports = AscentController
