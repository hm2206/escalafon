'use strict'

const { validation } = require('validator-error-adonis')
const CustomException = require('../../Exceptions/CustomException')
const Degree = use('App/Models/Degree')
const NotFoundModelException = require('../../Exceptions/NotFoundModelException')

class DegreeController {

    async store({ request }) {
        let datos = request.all() 
        await validation(null, datos, {
            work_id: 'required',
            type_degree_id: 'required',
            institution: 'required|max:200',
            document_number: 'required|max:40',
            date: 'required|dateFormat:YYYY-MM-DD',
            description: 'max:1000'
        })
        // procesar datos
        try {
            let degree = await Degree.create({
                work_id: datos.work_id,
                type_degree_id: datos.type_degree_id,
                institution: datos.institution,
                document_number: datos.document_number,
                date: datos.date,
                description: datos.description,
            })
            return {
                success: true,
                status: 201,
                message: "Los datos se guardarón correctamente!",
                degree,
            }
        } catch (error) {
            throw new CustomException("No se pudó guardar los datos")
        }
    }

    async update({ params, request }) {
        let degree = await Degree.find(params.id) 
        if (!degree) throw new NotFoundModelException("La formación académica")
        let datos = request.all() 
        await validation(null, datos, {
            type_degree_id: 'required',
            institution: 'required|max:200',
            document_number: 'required|max:40',
            date: 'required|dateFormat:YYYY-MM-DD',
            description: 'max:1000'
        })
        // procesar datos
        try {
            degree.merge({
                type_degree_id: datos.type_degree_id,
                institution: datos.institution,
                document_number: datos.document_number,
                date: datos.date,
                description: datos.description,
            })
            await degree.save()
            degree.type_degree = await degree.type_degree().fetch()
            // response
            return {
                success: true,
                status: 201,
                message: "Los cambios se guardarón correctamente!",
                degree,
            }
        } catch (error) {
            throw new CustomException("No se pudó guardar los cambios")
        }
    }

    async delete({ params }) {
        let degree = await Degree.find(params.id) 
        if (!degree) throw new NotFoundModelException("La formación académica")
        // procesar datos
        try {
            await degree.delete()
            // response
            return {
                success: true,
                status: 201,
                message: "Los datos se eliminarón correctamente!",
            }
        } catch (error) {
            throw new CustomException("No se pudó eliminar los datos")
        }
    }

}  

module.exports = DegreeController
