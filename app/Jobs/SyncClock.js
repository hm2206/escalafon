'use strict';

const { default: collect } = require('collect.js');
const ConfigAssistance = use('App/Models/ConfigAssistance');
const Work = use('App/Models/Work'); 
const Assistance = use('App/Models/Assistance');
const Clock = use('App/Models/Clock');
const moment = require('moment');
const ZKLib = require('node-zklib');
const uid = require('uid');
const Drive = use('Drive');
const { getSystemKey } = require('../Services/tools');
const { authentication } = require('../Services/apis');

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

  async changedSyncClock (sync = 1) {
    await Clock.query()
      .whereIn('id', this.ids)
      .update({ sync });
  }

  async deleteFileTemp () {
    let exists = await Drive.exists(this.pathRelative);
    if (exists) await Drive.delete(this.pathRelative);
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

  async initialClock () {
    this.syncConnect = await this.connect();
    // obtener info del reloj
    let info = await this.syncConnect.getInfo();
    let logs = await this.syncConnect.getAttendances();
    // desconectar del reloj
    await this.syncConnect.disconnect();
    if (info.logCounts != logs.data.length) return await this.initialClock();
    // sincronizar los datos del reloj con el sistema de escalafón
    await this.syncAssistance(logs.data);
    // guardar datos
    await this.saveAssistance();
    // delete file
    await this.deleteFileTemp();
  }

  async syncAssistance (datos) {
    if (!datos.length) {
      this.logs = [];
      return;
    }
    // generar slug
    this.slug = uid(10);
    // guardar logs temporal
    this.pathRelative = `clock/sync/assistance_${this.slug}.json`;
    let parseToString = await JSON.stringify(datos);
    await Drive.put(this.pathRelative, Buffer.from(parseToString));
    // setting logs
    this.logs = datos;
  }

  async saveAssistance () {
    // logs iterar
    for (let log of this.logs) {
      let current_date = moment(log.recordTime).format('YYYY-MM-DD');
      let current_time = moment(log.recordTime).format('HH:mm:ss');
      let config_assistance = this.config_assistances.where('date', current_date).first() || null;
      if (!config_assistance) {
        config_assistance = await ConfigAssistance.query()
          .where('entity_id', this.clock.entity_id)
          .where('date', current_date)
          .first();
        // agregar en caché
        if (config_assistance) await this.config_assistances.push(config_assistance);
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
      // obtener tipo de assistencia
      let status = 'ENTRY';
      if (last_assistance) {
        // ya existe el record time
        let exists_record_time = await Assistance.query()
          .where('config_assistance_id', config_assistance.id)
          .where('work_id', work.id)
          .where('record_time', current_time)
          .getCount('id');
        if (exists_record_time) continue;
        status = last_assistance.status == 'ENTRY' ? 'EXIT' : 'ENTRY';
      }
      // preparar datos 
      let payload = {
        config_assistance_id: config_assistance.id,
        work_id: work.id,
        clock_id: this.clock.id,
        record_time: current_time,
        status
      }
      // guardar en el assistance
      await Assistance.create(payload);
      await this.storage.push(payload);
    }
  }

  async sendNotification (title, description) {
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
        title,
        description,
        method: this.method,
        object_type: "App/Models/Assistance",
        object_id: 0
    };
    // request
    let { success, message } = await authentication.post(`auth/notification`, payload, options)
    .then(res => res.data)
    .catch(err => ({ success: false, message: err.message }));
    // disable sync cloks
    this.changedSyncClock(0);
  }

  async sendNotificationSuccess () {
    await this.sendNotification(
      `La sincronización de asistencia "${this.clock.name}" se realizó correctamente`,
      `Se encontrarón ${this.storage.count()} regístros de asistanecia, la cual se sincronizó con el sistema`
    )
    console.log('successfull');
  }

  async sendNotificationError (error) {
    await this.sendNotification(
      `La sincronización falló`,
      `No se pudo procesar la sincronización de asistencia, intente de nuevo!!!`
    )
    console.log('error', error.message);
  }

  async handle (data) {
    let { clocks, auth, app, method } = data;

    this.auth = auth;
    this.app = app;
    this.method = method;
    this.config_assistances = collect([]);
    this.storage = collect([]);

    // obtener ids
    this.ids = await collect(clocks).pluck('id').toArray();

    // sync clocks
    await this.changedSyncClock(1);

    // procesar
    try {
      for (let clock of clocks) {
        this.clock = clock;
        // executar clok
        await this.initialClock();
      }
      // enviar notificación
      await this.sendNotificationSuccess();
    } catch (error) {
      await this.sendNotificationError(error);
      // eliminar file temporal
      await this.deleteFileTemp();
    }
  }
  
}

module.exports = SyncClock

