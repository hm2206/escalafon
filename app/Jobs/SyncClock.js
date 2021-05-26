'use strict';

const { default: collect } = require('collect.js');
const ConfigAssistance = use('App/Models/ConfigAssistance');
const Work = use('App/Models/Work'); 
const Assistance = use('App/Models/Assistance');
const moment = require('moment');
const ZKLib = require('node-zklib');
const uid = require('uid');
const Drive = use('Drive');
const { getSystemKey } = require('../Services/tools');

class SyncClock {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency () {
    return 1
  }

  // This is required. This is a unique key used to identify this job.
  static get key () {
    return 'SyncClock-job'
  }

  async connect () {
    let zkInstance = new ZKLib(this.clock.host, this.clock.port, 10000, 4000);
    // realizar conexión
    try {
      await zkInstance.createSocket();
      return zkInstance;
    } catch (e) {
      throw new Error("No se pudó realizar la conexión");
    }
  }

  async syncAssistance (datos) {
    if (!datos.length) return;
    // generar slug
    this.slug = uid(10);
    // guardar logs temporal
    this.pathRelative = `clock/sync/assistance_${this.slug}.json`;
    await Drive.put(this.pathRelative, Buffer.from(JSON.stringify(datos)));
    // setting logs
    this.logs = collect(datos).sortBy('recordTime');
  }

  async saveAssistance () {
    // datos
    for (let log of this.logs) {
      let current_date = moment(log.recordTime).format('YYYY-MM-DD');
      let current_time = moment(log.recordTime).format('HH:mm:ss');
      let exists_config_assistance = this.config_assistances.where('date', current_date).first();
      let config_assistance;
      if (exists_config_assistance) config_assistance = exists_config_assistance;
      else {
        config_assistance = await ConfigAssistance.query()
          .where('date', current_date)
          .first();
        // agregar en caché
        if (config_assistance) this.config_assistances.push(config_assistance);
      }
      // validar config_assistance
      if (!config_assistance) continue;
      // obtener trabajador
      let work = await Work.findBy('code', log.deviceUserId);
      if (!work) continue;
      // obtener el último regístro del trabajador
      let last_assistance = await Assistance.query()
        .where('config_assistance_id', config_assistance.id)
        .where('work_id', work.id)
        .orderBy('record_time', 'DESC')
        .first();
      if (!last_assistance) last_assistance = await this.storage.where('work_id', work.id)
        .where('config_assistance_id', config_assistance.id)
        .sortByDesc('record_time', 'DESC')
        .first();
      // obtener tipo de assistencia
      let status = 'ENTRY';
      if (last_assistance) {
        if (last_assistance.record_time == current_time) continue;
        status = last_assistance.status == 'ENTRY' ? 'EXIT' : 'ENTRY';
      }
      // guardar datos locales en el storage
      let payload = {
        config_assistance_id: config_assistance.id,
        work_id: work.id,
        clock_id: this.clock.id,
        record_time: current_time,
        status
      }
      // guardar en el storage
      this.storage.push(payload);
    }
    // guardar en la db
    await Assistance.createMany(this.storage.toArray());
    // eliminar json
    let exists = await Drive.exists(this.pathRelative);
    if (exists) await Drive.delete(this.pathRelative);
  }

  async sendNotification () {
    // options
    let options = {
        headers: {
            Authorization: `Bearer ${this.auth.token && this.auth.token.token || ""}`,
            ClientId: this.app.client_id,
            ClientSecret: this.app.client_secret,
            SystemSecret: getSystemKey()
        }
    };
    // payload
    let payload = {
        receive_id: this.auth.id,
        title: `La sincronización del reloj "${this.clock.name}" se realizó correctamente`,
        description: `Ahora todos los datos encontrados fuerón sincronizados con el sistema`,
        method: this.method,
        object_type: "App/Models/Assistance",
        object_id: 0
    };
    // request
    authentication.post(`auth/notification`, payload, options)
    .then(res => res.data)
    .catch(err => ({ success: false, message: err.message }));
  }

  // This is where the work is done.
  async handle (data) {
    let { clocks, auth, app, method } = data;

    this.auth = auth;
    this.app = app;
    this.method = method;
    this.config_assistances = collect([]);
    this.storage = collect([]);

    for (let clock of clocks) {
      this.clock = clock;
      this.syncConnect = await this.connect();
      let logs = await this.syncConnect.getAttendances();
      this.syncConnect.disconnect();
      // sincronizar los datos del reloj con el sistema de escalafón
      await this.syncAssistance(logs.data);
      // guardar datos
      await this.saveAssistance();
    }
    // enviar notification
    await  this.sendNotification();
  }
}

module.exports = SyncClock

