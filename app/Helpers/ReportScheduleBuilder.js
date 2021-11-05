'use static';

const View = use('View');
const { default: collect } = require('collect.js');
const htmlToPdf = require('html-pdf-node');
const moment = require('moment');
const Schedule = use('App/Models/Schedule');
const Ballot = use('App/Models/Ballot');
const License = use('App/Models/License');
const Vacation = use('App/Models/Vacation');
const xlsx = require('node-xlsx');
const DB = use('Database');

const currentDate = moment();

class ReportScheduleBuilder {

    filters = {
        day: "",
        entity_id: "",
        cargo_id: "",
        type_categoria_id: "",
    }

    activities = [];

    result = null

    type = "pdf"

    year = currentDate.year();
    month = currentDate.month() + 1;

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
        format: 'A4',
        landscape: true
    }

    activityTypes = {
      ballot: "App/Models/Ballot",
      license: "App/Models/License",
      vacation: "App/Models/Vacation"
    }

    schedules = []

    constructor(authentication = {}, year, month, filters = this.filters, type = 'pdf') {
        this.authentication = authentication;
        this.filters = Object.assign(this.filters, filters);
        this.people = collect([]);
        this.type = type;
        this.year = year;
        this.month = month;
    }

    async getSchedules() {
      let countAssistance = DB.table('assistances as ass')
        .where('ass.schedule_id', DB.raw('schedules.id'))
        .where('ass.state', 1)
        .select(DB.raw('count(ass.id)'));
      let schedules = Schedule.query()
        .join('infos as i', 'i.id', 'schedules.info_id')
        .join('planillas as pla', 'pla.id', 'i.planilla_id')
        .join('type_categorias as cat', 'cat.id', 'i.type_categoria_id')
        .join('works as w', 'w.id', 'i.work_id')
        .where('pla.principal', 1)
        .where(DB.raw('YEAR(schedules.`date`)'), this.year)
        .where(DB.raw('MONTH(schedules.`date`)'), this.month)
        .orderBy('w.orden', 'ASC')
        .orderBy('schedules.date', 'ASC')
      // filters
      for (let attr in this.filters) {
          let value = this.filters[attr];
          if (value && attr == 'day') schedules.where(DB.raw(`DAY(schedules.date)`), value);
          else if (value) schedules.where(`i.${attr}`, value);
      } 
      // obtener
      schedules.select(
        'schedules.*', 
        'w.person_id', 
        'w.orden', 
        'cat.descripcion as displayCategoria',
        DB.raw(`(${countAssistance}) as assisted`)
      )
      schedules = await schedules.fetch();
      this.schedules = await schedules.toJSON();
    }

    async getBallots() {
      let ballots = Ballot.query()
        .join('schedules as sch', 'sch.id', 'ballots.schedule_id')
        .join('infos as i', 'sch.info_id', 'i.id')
        .where(DB.raw('YEAR(sch.`date`)'), this.year)
        .where(DB.raw('MONTH(sch.`date`)'), this.month);
      // filters
      for (let attr in this.filters) {
        let value = this.filters[attr];
        if (value && attr == 'day') ballots.where(DB.raw(`DAY(sch.date)`), value);
        else if (value) ballots.where(`i.${attr}`, value);
      } 
      // obtener 
      ballots.select(
        'ballots.*',
        DB.raw("'App/Models/Ballot' as type")
      )
      ballots = await ballots.fetch();
      return await ballots.toJSON();
    }

    async getLicenses() {
      let licenses = License.query()
        .join('infos as i', 'licenses.info_id', 'i.id')
        .join('schedules as sch', 'sch.info_id', 'i.id')
        .where(DB.raw(`(licenses.date_start <= sch.date AND licenses.date_over >= sch.date)`)) 
        .where(DB.raw('YEAR(sch.`date`)'), this.year)
        .where(DB.raw('MONTH(sch.`date`)'), this.month);
      // filters
      for (let attr in this.filters) {
        let value = this.filters[attr];
        if (value && attr == 'day') licenses.where(DB.raw(`DAY(sch.date)`), value);
        else if (value) licenses.where(`i.${attr}`, value);
      } 
      // obtener 
      licenses.select(
        'licenses.*',
        'sch.id as schedule_id',
        DB.raw("'App/Models/License' as type")
      )
      licenses = await licenses.fetch();
      return await licenses.toJSON();
    }

    async getVacations() {
      let vacations = Vacation.query()
        .join('config_vacations as conf', 'conf.id', 'vacations.config_vacation_id')
        .join('works as w', 'conf.work_id', 'w.id')
        .join('infos as i', 'i.work_id', 'w.id')
        .join('schedules as sch', 'sch.info_id', 'i.id')
        .where('i.entity_id', DB.raw('conf.entity_id'))
        .where(DB.raw(`(vacations.date_start <= sch.date AND vacations.date_over >= sch.date)`)) 
        .where(DB.raw('YEAR(sch.`date`)'), this.year)
        .where(DB.raw('MONTH(sch.`date`)'), this.month);
      // filters
      for (let attr in this.filters) {
        let value = this.filters[attr];
        if (value && attr == 'day') vacations.where(DB.raw(`DAY(sch.date)`), value);
        else if (value) vacations.where(`i.${attr}`, value);
      } 
      // obtener 
      vacations.select(
        'vacations.*',
        'sch.id as schedule_id',
        DB.raw("'App/Models/Vacation' as type")
      )
      vacations = await vacations.fetch();
      return await vacations.toJSON();
    }

    async getActivities() {
      this.activities = collect([]);
      // meta data
      let vacations = await this.getVacations();
      let licenses = await this.getLicenses();
      let ballots = await this.getBallots();
      // add meta data
      this.activities.push(...vacations);
      this.activities.push(...licenses);
      this.activities.push(...ballots);
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
        let idPlucked = collect(this.schedules).pluck('person_id');
        let idChunk = idPlucked.chunk(100);
        for (let ids of idChunk) {
            await this.getPeople(1, ids.toArray())
        }
    }

    async settingSchedules() {
      await this.schedules.map(s => {
        let activities = this.activities.where('schedule_id', s.id).toArray() || [];
        let person = this.people.where('id', s.person_id).first() || {};
        s.person = person;
        s.activities = activities;
        s.displayDate = moment(s.date, 'YYYY-MM-DD').format('DD/MM/YYYY');
        return s;
      });
    }

    dataRender() {
      return {
        schedules: this.schedules,
        activityTypes: this.activityTypes,
      }
    }

    async formatPDF(that, datos = []) {
        const html = View.render('report/schedules', datos);
        const file = { content: html }
        return await htmlToPdf.generatePdf(file, that.options);
    }

    async formatExcel(that, datos = {}) {
        let headers = [
            "N°", "Apellidos y Nombres", "Tipo", "Document",
            "Categoría", "Fecha", "Asistió", "Actividades"
        ];
        let content = [];
        let schedules = [...datos.schedules];
        // mapping
        schedules.map((b, index) => {
            content.push([
                index + 1,
                `${b.person.fullname || ''}`.toUpperCase(),
                `${b.person.document_type.name || ''}`.toUpperCase(),
                `${b.person.document_number || ''}`,
                `${b.date || ''}`,
                `${d.assisted ? 'Si' : 'No'}`,
                `Actividades`
            ]);
            // data
            return b;
        });
        // response
        let data = [headers, ...content];
        let result = await xlsx.build([{ name: 'reporte-schedules', data }])
        return result;
    }

    async render() {
        // obtener schedules
        await this.getSchedules();
        // obtener people
        await this.stepPeople();
        // obtener activities
        await this.getActivities();
        // setting works
        await this.settingSchedules();
        // render
        const datos = this.dataRender();
        // return {
        //   result: this.activities,
        //   header: 'appdlication/json'
        // }
        // render type
        let handle = this.allowType[this.type];
        let that = this;
        if (typeof handle.handle != 'function') throw new Error("No se pudó generar el reporte");
        let result = await handle.handle(that, datos);
        // response
        return {
            result,
            header: handle.header
        };
    }   
    

}

module.exports = ReportScheduleBuilder;