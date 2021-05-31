'use strict';

const ReportBuilder = use('ReportBuilder');
const htmlToPdf = require('html-pdf-node');
const Info = use('App/Models/Info');
const DB = use('Database');
const collect = require('collect.js');
const QRCode = require('qrcode');
const View = use('View');

const marital_status = {
    "S@M": "Soltero",
    "C@M": "Casado",
    "D@M": "Divorciado",
    "v@M": "Viudo",
    "S@F": "Soltera",
    "C@F": "Casada",
    "D@F": "Divorciada",
    "v@F": "Viuda",
}

class FichaBuilder {

    work = {};
    infos = [];
    infos_active = [];
    options = {
        format: 'A4',
    }

    constructor(work) {
        this.work = work;
    }

    async getInfos () {
        let infos = await Info.query()
            .join('type_categorias as cat', 'cat.id', 'infos.type_categoria_id')
            .where("work_id", this.work.id)
            .select('infos.*', DB.raw(`cat.descripcion as type_categoria, cat.information`))
            .fetch();
        this.infos = await infos.toJSON();
    }

    async getInfosActive () {
        let infos = collect(this.infos);
        infos = await infos.where('estado', 1).toArray();
        this.infos_active = infos;
    }

    async generateQr () {
        this.code_qr = await QRCode.toDataURL(`https://www.youtube.com/watch?v=WN7TeyLHjcQ`);
    }

    async execute () {
        await this.getInfos();
        await this.getInfosActive();
        await this.generateQr();
        return await this.render();
    }

    dataRender () {
        return {
            marital_status,
            work: this.work,
            infos: this.infos,
            infos_active: this.infos_active,
            code_qr: this.code_qr,
        }
    }

    async render() {
        let html = await View.render('report/ficha', this.dataRender());
        let file = { content: html };
        return await htmlToPdf.generatePdf(file, this.options);
    }

}

module.exports = FichaBuilder;