'use strict'

const TypeDegree = use('App/Models/TypeDegree')

class TypeDegreeController {

    async index({ request }) {
        let page = request.input('page', 1)
        let query_search = request.input('query_search', '') 
        let perPage = request.input('perPage', 20)
        let type_degrees = TypeDegree.query()
        if (query_search) type_degrees.where('name', 'like', `%${query_search}%`)
        type_degrees = await type_degrees.paginate(page, perPage)
        return {
            success: true,
            status: 200,
            type_degrees
        }
    }

}

module.exports = TypeDegreeController
