'use strict'

const { validation } = require('validator-error-adonis')
const Displacement = use('App/Models/Displacement')
const CustomException = require('../../Exceptions/CustomException')
const NotFoundModelException = require('../../Exceptions/NotFoundModelException')

class DisplacementController {

    async store({ request }) {
        // validar datos
        let datos = request.all() 
        await validation(null, datos, {
            info_id: 'required',
            resolution: 'required|max:100',
            date_resolution: 'required|dateFormat:YYYY-MM-DD',
            date_start: 'required|dateFormat:YYYY-MM-DD',
            date_over: 'dateFormat:YYYY-MM-DD',
            dependencia_id: 'required',
            perfil_laboral_id: 'required',
            description: 'required|max:1000'
        })
        // guardar datos
        try {
            let displacement = await Displacement.create({
                info_id: datos.info_id,
                resolution: datos.resolution,
                date_resolution: datos.date_resolution,
                date_start: datos.date_start,
                date_over: datos.date_over,
                dependencia_id: datos.dependencia_id,
                perfil_laboral_id: datos.perfil_laboral_id,
                description: datos.description
            })
            // response
            return {
                success: true,
                status: 201,
                message: "Los datos se guardarón correctamente!",
                displacement
            }
        } catch (error) {
            throw new CustomException("No se pudó guardar los datos")
        }
    }

    async update({ params, request }) {
        // obtener displacement
        let displacement = await Displacement.find(params.id) 
        if (!displacement) throw new NotFoundModelException("El desplazamiento")
        // validar datos
        let datos = request.all() 
        await validation(null, datos, {
            resolution: 'required|max:100',
            date_resolution: 'required|dateFormat:YYYY-MM-DD',
            date_start: 'required|dateFormat:YYYY-MM-DD',
            date_over: 'dateFormat:YYYY-MM-DD',
            dependencia_id: 'required',
            perfil_laboral_id: 'required',
            description: 'required|max:1000'
        })
        // guardar datos
        try {
            displacement.merge({
                resolution: datos.resolution,
                date_resolution: datos.date_resolution,
                date_start: datos.date_start,
                date_over: datos.date_over,
                dependencia_id: datos.dependencia_id,
                perfil_laboral_id: datos.perfil_laboral_id,
                description: datos.description
            })
            await displacement.save()
            // response
            return {
                success: true,
                status: 201,
                message: "Los cambios se guardarón correctamente!",
                displacement
            }
        } catch (error) {
            throw new CustomException("No se pudó guardar los datos")
        }
    }

    async delete({ params }) {
        // obtener displacement
        let displacement = await Displacement.find(params.id) 
        if (!displacement) throw new NotFoundModelException("El desplazamiento")
        // procesar
        try {
            await displacement.delete()
            return {
                success: true,
                status: 201,
                message: "El desplazamiento se eliminó correctamente!"
            }
        } catch (error) {
            throw new CustomException("No se pudó guardar los datos")
        }
    }

}

module.exports = DisplacementController
