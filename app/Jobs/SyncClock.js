'use strict';

const collect = require('collect.js');
const PreAssistance = use('App/Models/PreAssistance');
const Assistance = use('App/Models/Assistance');
const Schedule = use('App/Models/Schedule');
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
    let isSync = await apiClock.post(`assistances/${this.clock.host}/syncronize?year=${this.year}&month=${this.month}`)
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
    let allowAssistances = ['i.id', 'pre_assistances.clock_id', 'pre_assistances.date', 'pre_assistances.recordTime'];
    // obtener configuración del schedule
    let pre_assistances = await PreAssistance.query()
      .join('works as w', 'w.code', 'pre_assistances.deviceUserId')
      .join('infos as i', 'i.work_id', 'w.id')
      .join('schedules as s', 's.info_id', 'i.id')
      .where('s.date', DB.raw('pre_assistances.date'))
      .where('pre_assistances.clock_id', this.clock.id)
      .where('i.estado', 1)
      .orderBy('w.orden', 'ASC')
      .orderBy('pre_assistances.date', 'ASC')
      .orderBy('pre_assistances.recordTime', 'ASC')
      .select(...allowAssistances)
      .groupBy(...allowAssistances)
      .fetch();
    // convertir en json
    let index = 0;
    let datos = collect(await pre_assistances.toJSON());
    return await datos.map(d => {
      d.index = index++;
      return d;
    });
  }

  async preparateAssistances () {
    let payload = [];
    for (let log of this.logs) {
      // preperar 
      payload.push({
        deviceUserId: log.user_device_id,
        date: moment(`${log.year}-${log.month}-${log.day}`, 'YYYY-MM-DD').format('YYYY-MM-DD'),
        recordTime: `${moment(log.time, 'HH:mm:ss').format('HH:mm')}:00`,
        clock_id: this.clock.id
      });
    }
    // truncar datos
    await PreAssistance.truncate();
    // insert masive
    await PreAssistance.createMany(payload);
  }

  async getConfig(schedule = {}) {
    let config = this.config_assistances.where('id', schedule.info_id)
      .where('date', schedule.date)
    // filtrar por modo
    let findModo = ['ENTRY', 'EXIT'];
    if (findModo.includes(schedule.modo)) {
      return await config.first();
    } else {
      return await config.toArray();
    }
  }

  async validateSchedule(schedule, config) {
    if (!config) return;
    // eliminar config
    let indexes = this.config_assistances.pluck('index').toArray();
    let current_index = indexes.indexOf(config.index); 
    await this.config_assistances.splice(current_index, 1);
    // obtener date y time
    let current_date = moment(`${config.date} ${config.recordTime}`, 'YYYY-MM-DD HH:mm');
    let current_time = current_date.format('HH:mm:ss');
    let diff_time = moment(current_date.format('YYYY-MM-DD HH:mm:ss')).subtract(15, 'minutes').format('HH:mm:ss');
    // validar direfencia de hora
    let exists_record_time = await Assistance.query()
      .where('schedule_id', schedule.id)
      .where(DB.raw(`(record_time <= '${current_time}' AND record_time >= '${diff_time}')`))
      .getCount('id');
    if (exists_record_time) return;
    // preparar datos
    let payload = {
      schedule_id: schedule.id,
      clock_id: config.clock_id,
      record_time: current_time,
      delay: 0,
      extra: 0,
      status: 'ENTRY'
    }
    // validar modo
    if (schedule.modo == 'EXIT') payload.status = 'EXIT';
    else if (schedule.modo == 'ENTRY') payload.status = 'ENTRY';
    else {
      // obtener el ultimo regístro de asistencia
      let assistance = await Assistance.query()
        .where('schedule_id', schedule.id)
        .where('state', 1)
        .orderBy('record_time', 'DESC')
        .first();
      // verificar configuración del status
      if (assistance) payload.status = assistance.status == 'ENTRY' ? 'EXIT' : 'ENTRY';
    }  
    // validar delay y tiempo extra
    let time_record = moment(config.recordTime, 'HH:mm:ss');
    let duration = 0;
    if (payload.status == 'ENTRY') {
      let time_start = moment(schedule.time_start, 'HH:mm:ss');
      duration = moment.duration(time_record.diff(time_start)).asMinutes() - schedule.delay_start;
      payload.delay = duration > 0 ? duration : 0;
    } else {
      let time_over = moment(schedule.time_over, 'HH:mm:ss');
      duration = moment.duration(time_over.diff(time_record)).asMinutes();
      payload.delay = duration > 0 ? duration : 0;
      // validar extra
      if (payload.delay == 0) {
        duration = moment.duration(time_record.diff(time_over)).asMinutes();
        payload.extra = duration > 0 ? duration : 0;
      }
    }
    // guardamos la asistencias
    await Assistance.create(payload);
    // agregar assistencia
    this.storage.push(payload);
  }

  async syncAssistances () {
    this.config_assistances = await this.getPreAssistances();
    let infoIds = await collect(this.config_assistances.toArray()).groupBy('id').keys().toArray();
    // validar
    for (let id of infoIds) {
      // obtener schedules
      let schedules = await Schedule.query()
        .where('info_id', id)
        .where(DB.raw(`YEAR(date) = ${this.year} AND MONTH(date) = ${this.month}`))
        .orderBy('date', 'ASC')
        .orderBy('orden', 'ASC')
        .select('*', DB.raw(`IF(modo = 'EXIT', time_over, time_start) as orden`))
        .fetch();
      schedules = collect(await schedules.toJSON());
      // configurar schedule
      for (let schedule of schedules) {
        let validateModo = ['ENTRY', 'EXIT'];
        if (validateModo.includes(schedule.modo)) {
          let config = await this.getConfig(schedule);
          await this.validateSchedule(schedule, config);
        } else {
          let configs = await this.getConfig(schedule);
          for (let current_config of configs) {
            await this.validateSchedule(schedule, current_config);
          }
        }
      }
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
      `Se encontrarón ${this.storage.count()} regístros de asistencia en el mes de ${this.month} del ${this.year}, la cual se sincronizó con el sistema`
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

