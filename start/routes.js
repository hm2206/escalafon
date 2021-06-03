'use strict'

const Route = require('../app/Services/route');

// Afps
Route('get', 'AfpController.index').middleware(['jwt']);

// Bancos
Route('get', 'BancoController.index').middleware(['jwt']);

// Works
Route('get', 'WorkController.index').middleware(['jwt']);
Route('post', 'WorkController.store').middleware(['jwt']);
Route('get', 'WorkController.show').middleware(['jwt']);
Route('put', 'WorkController.update').middleware(['jwt']);
Route('get', 'WorkController.ficha').middleware(['jwt', 'entityId']);
Route('get', 'WorkController.infos').middleware(['jwt', 'entityId']);
Route('get', 'WorkController.schedules').middleware(['jwt', 'entityId']);

// Infos
Route('get', 'InfoController.index').middleware(['jwt', 'entityId']);
Route('post', 'InfoController.store').middleware(['jwt', 'entityId']);
Route('get', 'InfoController.show').middleware(['jwt', 'entityId']);
Route('get', 'InfoController.schedules').middleware(['jwt', 'entityId']);

// Clocks
Route('get', 'ClockController.index').middleware(['jwt', 'entityId']);
Route('post', 'ClockController.store').middleware(['jwt', 'entityId']);
Route('post', 'ClockController.syncAssistances').middleware(['jwt', 'entityId']);

// config Assistance
Route('get', 'ConfigAssistanceController.index').middleware(['jwt', 'entityId']);
Route('post', 'ConfigAssistanceController.store').middleware(['jwt', 'entityId']);
Route('delete', 'ConfigAssistanceController.delete').middleware(['jwt', 'entityId']);
Route('get', 'ConfigAssistanceController.assistances').middleware(['jwt', 'entityId']);

// Assistance
Route('get', 'AssistanceController.index').middleware(['jwt', 'entityId']);
Route('post', 'AssistanceController.store').middleware(['jwt', 'entityId']);
Route('put', 'AssistanceController.update').middleware(['jwt', 'entityId']);
Route('delete', 'AssistanceController.delete').middleware(['jwt', 'entityId']);

// Entity
Route('get', 'EntityController.works').middleware(['jwt', 'entityId']);

// config Schedule
Route('get', 'ConfigScheduleController.index').middleware(['jwt', 'entityId']);
Route('post', 'ConfigScheduleController.store').middleware(['jwt', 'entityId']);