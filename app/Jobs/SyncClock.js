'use strict';

const collect = require('collect.js');
const PreAssistance = use('App/Models/PreAssistance');
const Assistance = use('App/Models/Assistance');
const Clock = use('App/Models/Clock');
const moment = require('moment');
const DB = use('Database');
const { getSystemKey } = require('../Services/tools');
const { authentication, apiClock } = require('../Services/apis');

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
      .where('id', this.clock.id)
      .update({ sync });
  }

  async syncClock () {
    // sincronizar reloj
    let isSync = await apiClock.post(`assistances/${this.clock.host || ""}/syncronize`)
    .then(() => true)
    .catch(() => false)
    // validar sincronización
    if (!isSync) throw new Error("No se pudó sincronizar el reloj");
  }

  async getAttendances () {
    let { success, assistances } = await apiClock.get(`assistances?ip=${this.clock.host}&year=${this.year}&month=${this.month}`)
    .then(res => res.data)
    .catch(() => ({ success: false }));
    if (!success) throw new Error("No se pudó obtener los regístros de asistencia");
    this.logs = collect(assistances);
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

  async preparateAssistances () {
    let payload = [];
    for (let log of this.logs) {
      // preperar 
      payload.push({
        deviceUserId: log.user_device_id,
        date: moment(`${log.year}-${log.month}-${log.day}`, 'YYYY-MM-DD').format('YYYY-MM-DD'),
        recordTime: log.time,
        clock_id: this.clock.id
      });
    }
    // truncar datos
    await PreAssistance.truncate();
    // insert masive
    await PreAssistance.createMany(payload);
  }

  async syncAssistances () {
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
    let { clock, auth, app, method, year, month } = data;

    this.clock = clock;
    this.auth = auth;
    this.app = app;
    this.method = method;
    this.config_assistances = collect([]);
    this.storage = collect([]);
    this.year = year;
    this.month = month;

    // sync clocks
    await this.changedSyncClock(1);

    // procesar
    try {
      // realizar sincronización del reloj
      await this.syncClock();
      // obtener los registros del reloj
      await this.getAttendances();
      // preparar asistencia
      await this.preparateAssistances();
      // executar sincronización de asistencia
      await this.syncAssistances();
      // liberar sincronización
      await this.changedSyncClock(0);
      // enviar notificación
      await this.sendNotificationSuccess();
    } catch (error) {
      // liberar sincronización
      await this.changedSyncClock(0);
      // notificar error
      await this.sendNotificationError(error);
    }
  }
  
}

module.exports = SyncClock

