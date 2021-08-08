'use strict'

const { validation } = require('validator-error-adonis')
const CustomException = require('../../Exceptions/CustomException')
const Merit = use('App/Models/Merit')
const NotFoundModelException = require('../../Exceptions/NotFoundModelException')

class MeritController {

    async store({ request }) {
        let datos = request.all()
        await validation(null, datos, {
            info_id: 'required',
            resolution: 'required|max:255',
            date_resolution: 'required|dateFormat:YYYY-MM-DD',
            date: 'required|dateFormat:YYYY-MM-DD',
            title: 'required|max:100',
            modo: 'required',
            description: 'max:1000',
        })
        // procesar datos
        try {
            let merit = await Merit.create({
                info_id: datos.info_id,
                resolution: datos.resolution,
                date_resolution: datos.date_resolution,
                date: datos.date,
                title: datos.title,
                modo: datos.modo,
                description: datos.description
            })
            // response
            return {
                success: true,
                status: 201,
                message: "Los datos se guardarón correctamente!",
                merit
            }
        } catch (error) {
            throw new CustomException("No se pudó guardar los datos")
        }
    }

    async update({ params, request }) {
        // obtener el merit
        let merit = await Merit.find(params.id);
        if (!merit) throw new NotFoundModelException("El mérito/demérito")
        let datos = request.all()
        await validation(null, datos, {
            title: 'required|max:100',
            date: 'required|dateFormat:YYYY-MM-DD',
            resolution: 'required|max:255',
            date_resolution: 'required|dateFormat:YYYY-MM-DD',
            modo: 'required',
            description: 'max:1000',
        })
        // procesar datos
        try {
            merit.merge({
                title: datos.title,
                resolution: datos.resolution,
                date_resolution: datos.date_resolution,
                date: datos.date,
                modo: datos.modo,
                description: datos.description
            })

            await merit.save()
            // response
            return {
                success: true,
                status: 201,
                message: "Los cambios se guardarón correctamente!",
                merit
            }
        } catch (error) {
            throw new CustomException("No se pudó guardar los datos")
        }
    }

    async delete({ params }) {
        // obtener el merit
        let merit = await Merit.find(params.id);
        if (!merit) throw new NotFoundModelException("El mérito/demérito")
        // procesar datos
        try {
            await merit.delete()
            // response
            return {
                success: true,
                status: 201,
                message: "El mérito/demérito se eliminó correctamente!",
            }
        } catch (error) {
            throw new CustomException("No se pudó eliminar el regístro")
        }
    }

}

module.exports = MeritController
