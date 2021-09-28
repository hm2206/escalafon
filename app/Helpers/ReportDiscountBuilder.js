'use strict';

const View = use('View');
const { default: collect } = require('collect.js');
const htmlToPdf = require('html-pdf-node');
const moment = require('moment');
const Discount = use('App/Models/Discount');
const xlsx = require('node-xlsx');
const currencyFormatter = require('currency-formatter')
const DB = use('Database');

const currentDate = moment();

const optionsCurrency = {
    symbol: '',
    thousandsSeparator: ",",
    decimalSeparator: ".",
    decimalDigits: 2,
    spaceBetweenAmountAndSymbol: false
}

class ReportDiscountBuilder {

    filters = {
        entity_id: "",
        planilla_id: "",
        cargo_id: "",
        type_categoria_id: "",
        year: currentDate.year(),
        month: currentDate.month() + 1
    }

    result = null
    
    total_discount = 0;
    total_apply = 0;
    total_diference = 0;

    type = "pdf"

    allowType = {
        pdf: {
            handle: this.formatPDF,
            header: 'application/pdf'
        },
        excel: {
            handle: this.formatExcel,
            header: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
    }

    options = {
        format: 'A4'
    }

    discounts = []
    detalles = []


    constructor(authentication = {}, filters = this.filters, type = 'pdf') {
        this.authentication = authentication;
        this.filters = Object.assign(this.filters, filters);
        this.people = collect([]);
        this.type = type;
    }

    async getDiscounts() {
        let descuento = DB.raw(`
            SELECT SUM(des.monto) FROM discount_detalles as dd
            INNER JOIN descuentos as des ON des.id = dd.descuento_id 
            INNER JOIN historials as h ON h.id = des.historial_id
            WHERE dd.discount_id = discounts.id
        `);
        // discounts
        let discounts = Discount.query()
            .join('infos as i', 'i.id', 'discounts.info_id')
            .join('config_discounts as c', 'c.id', 'discounts.config_discount_id')
            .join('works as w', 'w.id', 'i.work_id')
            .join('type_categorias as t', 't.id', 'i.type_categoria_id')
            .whereIn('c.status', ['ACCEPTED'])
            .where('discounts.discount', '>', 0)
            .orderBy('w.orden', 'ASC')
        // filtros
        for(let attr in this.filters) {
            let value = this.filters[attr];
            if (!value) continue;
            if (attr == 'year') {
                discounts.where(`c.year`, value);
            } else if (attr == 'month') {
                discounts.where(`c.month`, value);
            } else {
                discounts.where(`i.${attr}`, value);
            }
        }
        // obtener
        discounts.select(
            'i.*', 'w.person_id', 'discounts.base', 't.descripcion as categoriaDisplay',
            'discounts.discount_min', 'discounts.discount',
            DB.raw(`IFNULL((${descuento}), 0) as discount_apply`),
            DB.raw(`discounts.discount - IFNULL((${descuento}), 0) as discount_diference`)
        )
        discounts = await discounts.fetch();
        this.discounts = discounts.toJSON();
        let discountCollection = collect(this.discounts);
        this.total_discount = currencyFormatter.format(discountCollection.sum('discount'), { code: 'PEN' });
        this.total_apply = currencyFormatter.format(discountCollection.sum('discount_apply'), { code: 'PEN' });
        this.total_diference = currencyFormatter.format(discountCollection.sum('discount_diference'), { code: 'PEN' });
    }

    async getDetalles() {
        let detalles = Discount.query()
            .join('infos as i', 'i.id', 'discounts.info_id')
            .join('config_discounts as c', 'c.id', 'discounts.config_discount_id')
            .join('discount_detalles as dd', 'dd.discount_id', 'discounts.id')
            .join('descuentos as des', 'des.id', 'dd.descuento_id')
            .join('type_descuentos as type', 'type.id', 'des.type_descuento_id')
            .join('historials as his', 'his.id', 'des.historial_id')
            .join('cronogramas as cro', 'cro.id', 'his.cronograma_id')
            .join('planillas as pla', 'pla.id', 'cro.planilla_id')
            .whereIn('c.status', ['ACCEPTED'])
            .where('discounts.discount', '>', 0)
        // filtros
        for(let attr in this.filters) {
            let value = this.filters[attr];
            if (!value) continue;
            if (attr == 'year') {
                detalles.where(`c.year`, value);
            } else if (attr == 'month') {
                detalles.where(`c.month`, value);
            } else {
                detalles.where(`i.${attr}`, value);
            }
        }
        // obtener
        detalles.select(
            'discounts.id', DB.raw('pla.nombre as displayPlanilla'), 
            'cro.year', 'cro.mes',
            DB.raw('type.descripcion as displayDescuento'), 'des.monto'
        )
        detalles = await detalles.fetch();
        this.detalles = collect(await detalles.toJSON());
    }

    async getPeople(page = 1, ids = []) {
        let datos = await this.authentication.get(`person?page=${page}&ids=${ids.join('&ids=')}&perPage=100`)
        .then(res => {
            let { people } = res.data
            return { ...people, success: true }
        })
        .catch(() => ({ success: false }))
        if (!datos.success) return;
        // guardar datos
        await this.people.push(...datos.data);
        // siguiente carga
        let nextPage = page + 1;
        if (datos.lastPage >= nextPage) await this.getPeople(nextPage);
    }

    async stepPeople() {
        let idPlucked = collect(this.discounts).pluck('person_id');
        let idChunk = idPlucked.chunk(100);
        for (let ids of idChunk) {
            await this.getPeople(1, ids.toArray())
        }
    }

    async settingDiscounts() {
        for(let discount of this.discounts) {
            discount.descuentos = await this.detalles.where('id', discount.id).toArray() || [];
            let person = await this.people.where('id', discount.person_id).first() || {}
            if (person.id) {
                person.date_of_birth = moment(`${person.date_of_birth}`, 'YYYY-MM-DD').format('DD/MM/YYYY');
            }

            discount.base = currencyFormatter.format(discount.base, { code: 'PEN' })
            discount.monto = currencyFormatter.format(discount.monto, optionsCurrency)
            discount.discount = currencyFormatter.format(discount.discount, optionsCurrency)
            discount.discount_apply = currencyFormatter.format(discount.discount_apply, optionsCurrency)
            discount.discount_diference = currencyFormatter.format(discount.discount_diference, optionsCurrency)
            discount.person = person;

            // setting descuentos
            for (let descuento of discount.descuentos) {
                descuento.monto = currencyFormatter.format(descuento.monto, optionsCurrency);
            }
        }
    }

    dataRender() {
        return {
            discounts: this.discounts,
            total_discount: this.total_discount,
            total_apply: this.total_apply,
            total_diference: this.total_diference
        }
    }

    async formatPDF(that, datos = []) {
        const html = View.render('report/discount', datos);
        const file = { content: html }
        return await htmlToPdf.generatePdf(file, that.options);
    }

    async formatExcel(that, datos = {}) {
        let headers = ["N°", "Apellidos y Nombres", "Tipo", "Document", "Cat", "Base", "Min", "Descuento", "Aplicado", "Diferencia"];
        let content = [];
        let works = [...datos.works];
        // mapping
        works.map((w, index) => {
            content.push([
                index + 1,
                `${w.person.fullname || ''}`.toUpperCase(),
                `${w.person.document_type.name || ''}`.toUpperCase(),
                `${w.person.document_number || ''}`,
                `${w.person.gender || ''}`,
                `${w.person.date_of_birth || ''}`,
                `${w.person.edad || ''}`,
                `${w.person.email_contact || ''}`,
                `${w.person.phone || ''}`,
                `${w.person.address || ''}`
            ]);
            // data
            return w;
        });
        // response
        let data = [headers, ...content];
        let result = await xlsx.build([{ name: 'reporte-general', data }])
        return result;
    }

    async render() {
        // obtener discounts
        await this.getDiscounts();
        // obtener detalles
        await this.getDetalles();
        // obtener people
        await this.stepPeople();
        // setting works
        await this.settingDiscounts();
        // render
        const datos = this.dataRender();
        // render type
        let handle = this.allowType[this.type];
        let that = this;
        if (typeof handle.handle != 'function') throw new Error("No se pudó generar el reporte");
        let result = await handle.handle(that, datos);
        return {
            result,
            header: handle.header
        };
    }   

}

module.exports = ReportDiscountBuilder;