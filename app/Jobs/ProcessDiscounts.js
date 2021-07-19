'use strict'

const Redis = use('Redis');
const DB = use('Database');
const Info = use('App/Models/Info');
const Schedule = use('App/Models/Schedule');
const Assistance = use('App/Models/Assistance');
const Discount = use('App/Models/Discount');
const collect = require('collect.js');
const moment = require('moment');
const CalcDiscountProcedure = require('../Procedures/CalcDiscountProcedure');


class ProcessDiscounts {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency () {
    return 1
  }

  // This is required. This is a unique key used to identify this job.
  static get key () {
    return 'ProcessDiscounts-job'
  }

  storage = [];
  headers = [];
  infos = [];
  schedules = [];
  ballots = [];

  // generar discount_min
  async generateDiscountMin(date_over) {
    let days = 30;
    if (!date_over) return days;
    let date_current = moment(`${this.year}-${this.month}-01`, 'YYYY-MM-DD');
    let date_cese = moment(date_over, 'YYYY-MM-DD');
    days = date_cese.diff(date_current, 'days').valueOf();
    days = days >= 30 ? 30 : days;
    return days;
  }

  // obtener contratos 
  async getInfos() {
    let infos = await Info.query()
      .whereHas('schedules', (builder) => {
        builder.where(DB.raw('YEAR(date)'), this.year)
        .where(DB.raw('MONTH(date)'), this.month)
      })
      .join('config_infos as c', 'c.info_id', 'infos.id')
      .where('infos.entity_id', this.entity.id)
      .where('infos.estado', 1)
      .where('c.base', 0)
      .select('infos.id', 'infos.fecha_de_cese', DB.raw('SUM(c.monto) as monto'))
      .groupBy('infos.id', 'infos.fecha_de_cese')
      .fetch();
    this.infos = await infos.toJSON();
  }

  // obtener schudule
  async getSchedules() {
    let schedules = await Schedule.query()
      .join('infos as i', 'i.id', 'schedules.info_id')
      .where('i.entity_id', this.entity.id)
      .where(DB.raw('YEAR(schedules.date)'), this.year)
      .where(DB.raw('MONTH(schedules.date)'), this.month)
      .select('schedules.*')
      .fetch();
    this.schedules = collect(await schedules.toJSON());
  }

  // obtener asssitances
  async getAssistances() {
    let assistances = await Assistance.query()
      .join('schedules as s', 's.id', 'assistances.schedule_id')
      .join('infos as i', 'i.id', 's.info_id')
      .where('i.entity_id', this.entity.id)
      .where(DB.raw('YEAR(s.date)'), this.year)
      .where(DB.raw('MONTH(s.date)'), this.month)
      .select('assistances.*')
      .fetch();
    this.assistances = collect(await assistances.toJSON());
  }

  // setting cntratos
  async settingInfos() {
    for(let info of this.infos) {
      // generar calculo
      let days = await this.generateDiscountMin(info.fecha_de_cese);
      // procesar
      try {
        // crear discount
        await Discount.create({
          info_id: info.id,
          year: this.year,
          month: this.month,
          base: info.monto,
          days,
          discount_min: 0,
          discount: 0
        });
      } catch (error) {
        await Discount.query()
          .where('info_id', info.id)
          .where('year', this.year)
          .where('month', this.month)
          .update({
            base: info.monto,
            days,
            discount_min: 0,
            discount: 0
          })
      }
    }
  }

  // This is where the work is done.
  async handle (data) {
    this.entity = data.entity;
    this.app = data.app;
    this.auth = data.auth;
    this.method = data.method;
    this.year = data.year;
    this.month = data.month;
    this.keyRedis = data.keyRedis;
    // procesar
    try {
      // obtener infos
      await this.getInfos();
      // obtener schedules
      await this.getSchedules();
      // obtener assistances
      await this.getAssistances();
      // settings
      await this.settingInfos();
      // actualizar
      await CalcDiscountProcedure.call({ entity_id: this.entity.id, year: this.year, month: this.month });
    } catch (error) {
      console.log(error);
    }
    // liberar caché
    await Redis.set(this.keyRedis, 0);
    // listo
    console.log('successfull');
  }
}

module.exports = ProcessDiscounts

