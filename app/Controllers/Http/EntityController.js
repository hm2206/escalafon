'use strict';

const EntityEntity = require('../../Entities/EntityEntity');
const NotFoundModelException = require('../../Exceptions/NotFoundModelException');

class EntityController {

    async works ({ params, request }) {
        let authentication = request.api_authentication;
        const page = request.input('page', 1);
        const query_search = request.input('query_search', '');
        const entity = request.$entity;
        if (entity.id != params.id) throw new NotFoundModelException("La entidad");
        const entityEntity = new EntityEntity(authentication);
        const works = await entityEntity.works(entity, { page, query_search });
        return {
            success: true,
            status: 201,
            entity,
            works
        }
    }

}

module.exports = EntityController
