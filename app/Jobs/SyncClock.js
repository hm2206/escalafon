'use strict';

const collect = require('collect.js');
const Schedule = use('App/Models/Schedule');
const Work = use('App/Models/Work'); 
const Info = use('App/Models/Info');
const PreAssistance = use('App/Models/PreAssistance');
const Assistance = use('App/Models/Assistance');
const Clock = use('App/Models/Clock');
const moment = require('moment');
const ZKLib = require('node-zklib');
const uid = require('uid');
const Drive = use('Drive');
const DB = use('Database');
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

  async connect (timeout = 10000, inport = 4000) {
    let zkInstance = new ZKLib(this.clock.host, this.clock.port, timeout, inport);
    // realizar conexión
    try {
      await zkInstance.createSocket();
      return zkInstance;
    } catch (e) {
      throw new Error("No se pudó realizar la conexión");
    }
  }

  async getCountLogs () {
    this.syncConnect = await this.connect();
    let { logCounts } = await this.syncConnect.getInfo();
    this.logCounts = logCounts;
    await this.syncConnect.disconnect(); 
  }

  async getPreAssistances () {
    // obtener configuración del schedule
    let pre_assistances = await PreAssistance.query()
      .join('works as w', 'w.code', 'pre_assistances.deviceUserId')
      .join('infos as i', 'i.work_id', 'w.id')
      .join('schedules as s', 's.info_id', 'i.id')
      .where('s.date', DB.raw('pre_assistances.date'))
      .where('pre_assistances.clock_id', this.clock.id)
      .where('i.estado', 1)
      .orderBy('w.orden', 'ASC')
      .orderBy('pre_assistances.recordTime', 'ASC')
      .select('s.id as schedule_id', 'pre_assistances.clock_id', 'pre_assistances.date', 
        'pre_assistances.recordTime','s.time_start', 's.time_over', 's.delay_start', 's.delay_over')
      .fetch();
    // convertir en json
    return pre_assistances.toJSON();
  }

  async initialClock () {
    // volver a conectar y obtener los regístros
    this.syncConnect = await this.connect(100000, this.logCounts);
    let { data } = await this.syncConnect.getAttendances();
    // desconectar del reloj
    await this.syncConnect.disconnect();
    // obtener logs
    let logs = data;
    // validar data
    if (this.logCounts != logs.length) return await this.initialClock();
    // sincronizar los datos del reloj con el sistema de escalafón
    await this.syncAssistance(logs);
    // preparar datos
    await this.preparateAssistance();
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
    this.logs = collect(datos);
  }

  async preparateAssistance () {
    let payload = [];
    for (let log of this.logs) {
      let current_date = moment(log.recordTime);
      // filtrar fecha permitidas
      if (current_date.year() != this.year || (current_date.month() + 1) != this.month) continue;
      // preperar 
      payload.push({
        deviceUserId: log.deviceUserId,
        date: moment(log.recordTime).format('YYYY-MM-DD'),
        recordTime: moment(log.recordTime).format('HH:mm:ss'),
        clock_id: this.clock.id
      });
    }
    // truncar datos
    await PreAssistance.truncate();
    // insert masive
    await PreAssistance.createMany(payload);
  }

  async saveAssistance () {
    this.config_assistances = await this.getPreAssistances();
    // validar
    for (let config of this.config_assistances) {
      // configs
      let status = 'ENTRY';
      let current_date = moment(`${config.date} ${config.recordTime}`);
      let current_time = current_date.format('HH:mm:ss');
      let diff_time = current_date.subtract(1, 'minutes').format('HH:mm:ss');
      // obtener el ultimo regístro de asistencia
      let last_assistance = await Assistance.query()
        .where('schedule_id', config.schedule_id)
        .where('state', 1)
        .orderBy('record_time', 'DESC')
        .first();
      // verificar si el regístro es igual al de la configuración
      if (last_assistance) {
        // verificar si la asistencia ya existe
        let exists_record_time = await Assistance.query()
          .where('schedule_id', config.schedule_id)
          .where(DB.raw(`(record_time <= '${current_time}' AND record_time >= '${diff_time}')`))
          .getCount('id');
        if (exists_record_time) continue;
        status = last_assistance.status == 'ENTRY' ? 'EXIT' : 'ENTRY';
      }
      // generamos la pre carga
      let payload = {
        schedule_id: config.schedule_id,
        clock_id: config.clock_id,
        record_time: config.recordTime,
        status
      }
      // obtener recordTime
      let time_record = moment(config.recordTime, 'HH:mm:ss');
      // validar delay
      let delay = 0;
      let duration = 0;
      if (payload.status == 'ENTRY') {
        let time_start = moment(config.time_start, 'HH:mm:ss');
        duration = moment.duration(time_record.diff(time_start)).asMinutes();
        delay = duration > 0 ? duration : 0;
      } else {
        let time_over = moment(config.time_over, 'HH:mm:ss');
        duration = moment.duration(time_over.diff(time_record)).asMinutes();
        delay = duration > 0 ? duration : 0;
      }
      // save delay
      payload.delay = delay;
      // guardamos y agregamos al storage
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
    let { clocks, auth, app, method, year, month } = data;

    this.auth = auth;
    this.app = app;
    this.method = method;
    this.config_assistances = collect([]);
    this.storage = collect([]);
    this.year = year;
    this.month = month;

    // obtener ids
    this.ids = await collect(clocks).pluck('id').toArray();

    // sync clocks
    await this.changedSyncClock(1);

    // procesar
    try {
      for (let clock of clocks) {
        this.clock = clock;
        // obtener info del reloj
        await this.getCountLogs();
        // executar clok
        await this.initialClock();
        // liberar sincronización
        await this.changedSyncClock(0);
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

