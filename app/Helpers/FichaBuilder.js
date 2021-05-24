'use strict';

const ReportBuilder = use('ReportBuilder');

class FichaBuilder {

    constructor(work) {
        this.work = work;
    }

    async render() {
        await ReportBuilder.loadView('report/ficha', { work: this.work });
        const bufferResult = await ReportBuilder.outputBuffer();
        return bufferResult;
    }

}

module.exports = FichaBuilder;