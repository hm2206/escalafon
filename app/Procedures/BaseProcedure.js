'use strict';

const DB = use('Database');

class BaseProcedure {

    static get procedure () {
        return this.name;
    }

    static get params () {
        return {};
    }
    
    static get arguments () {
        return {};
    }

    static get response () {
        return [];
    }

    static get query () {
        return [];
    }

    generateParams (params = []) {
        let newParams = [];
        for (let p in params) {
            let obj = params[p];
            newParams.push(`IN ${obj.name} ${obj.type.toUpperCase()}(${obj.length ? obj.length : ''})`);
        }
        // agregar
        this.query_params = newParams.join(', ');
    }

    async execute (procedure) {
        await this.generateParams(procedure.params);
        // executar procedure
        await DB.raw(`DROP PROCEDURE IF EXISTS ${procedure.name};`);
        return await DB.raw(`CREATE PROCEDURE ${procedure.name}(${this.query_params}) 
            BEGIN
                ${procedure.query.join(' \n')}
            END
        `);
    }

    static async up () {
        let procedure = new this;
        const upProcedure = await procedure.execute(this);
        console.log(`up procedure => ${this.name}`);
        return upProcedure;
    }

    static async call (args = this.arguments, debug = false) {
        let newArgs = Object.assign(this.arguments, args);
        let query = [];
        for (let attr in this.params) {
            query.push(typeof newArgs[attr] == 'undefined' ? 'null' : newArgs[attr]);
        }
        // execute
        let preparate = `CALL ${this.procedure}(${query.join(', ')})`;
        if (debug) console.log(preparate);
        return await DB.raw(preparate);
    }

}

module.exports = BaseProcedure;