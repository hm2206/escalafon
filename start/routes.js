'use strict'

const Route = require('../app/Services/route');

// Entity
Route('get', 'EntityController.works').middleware(['jwt', 'entityId']);

// Afps
Route('get', 'AfpController.index').middleware(['jwt']);

// Bancos
Route('get', 'BancoController.index').middleware(['jwt']);

// Works
Route('get', 'WorkController.index').middleware(['jwt', 'entityId']);
Route('post', 'WorkController.store').middleware(['jwt']);
Route('get', 'WorkController.show').middleware(['jwt']);
Route('put', 'WorkController.update').middleware(['jwt']);
Route('get', 'WorkController.ficha').middleware(['jwt', 'entityId']);
Route('get', 'WorkController.infos').middleware(['jwt', 'entityId']);

// Infos
Route('get', 'InfoController.index').middleware(['jwt', 'entityId']);
Route('post', 'InfoController.store').middleware(['jwt', 'entityId']);
Route('get', 'InfoController.show').middleware(['jwt', 'entityId']);
Route('get', 'InfoController.schedules').middleware(['jwt', 'entityId']);
Route('post', 'InfoController.syncSchedules').middleware(['jwt', 'entityId']);
Route('get', 'InfoController.ballots').middleware(['jwt', 'entityId']);

// Clocks
Route('get', 'ClockController.index').middleware(['jwt', 'entityId']);
Route('post', 'ClockController.store').middleware(['jwt', 'entityId']);
Route('post', 'ClockController.syncAssistances').middleware(['jwt', 'entityId']);

// Schedules
Route('post', 'ScheduleController.store').middleware(['jwt', 'entityId']);
Route('put', 'ScheduleController.update').middleware(['jwt', 'entityId']);
Route('delete', 'ScheduleController.delete').middleware(['jwt', 'entityId']);
Route('post', 'ScheduleController.replicar').middleware(['jwt', 'entityId']);

// Assistance
Route('get', 'AssistanceController.index').middleware(['jwt', 'entityId']);
Route('post', 'AssistanceController.store').middleware(['jwt', 'entityId']);
Route('put', 'AssistanceController.update').middleware(['jwt', 'entityId']);
Route('delete', 'AssistanceController.delete').middleware(['jwt', 'entityId']);
Route('get', 'AssistanceController.reportMonthly').middleware(['jwt', 'entityId']);

// Ballots
Route('post', 'BallotController.store').middleware(['jwt', 'entityId']);