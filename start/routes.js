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
Route('get', 'WorkController.config_vacations').middleware(['jwt', 'entityId']);
Route('get', 'WorkController.reportVacations').middleware(['jwt', 'entityId']);

// Infos
Route('get', 'InfoController.index').middleware(['jwt', 'entityId']);
Route('post', 'InfoController.store').middleware(['jwt', 'entityId']);
Route('get', 'InfoController.show').middleware(['jwt', 'entityId']);
Route('get', 'InfoController.schedules').middleware(['jwt', 'entityId']);
Route('post', 'InfoController.syncSchedules').middleware(['jwt', 'entityId']);
Route('get', 'InfoController.ballots').middleware(['jwt', 'entityId']);
Route('get', 'InfoController.permissions').middleware(['jwt', 'entityId']);
Route('get', 'InfoController.licenses').middleware(['jwt', 'entityId']);

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
Route('delete', 'BallotController.delete').middleware(['jwt', 'entityId']);
Route('put', 'BallotController.update').middleware(['jwt', 'entityId']);

// Config Vacation
Route('post', 'ConfigVacationController.store').middleware(['jwt', 'entityId']);
Route('put', 'ConfigVacationController.update').middleware(['jwt']);
Route('delete', 'ConfigVacationController.delete').middleware(['jwt']);
Route('get', 'ConfigVacationController.vacations').middleware(['jwt']);

// Vacaciones
Route('post', 'VacationController.store').middleware(['jwt', 'entityId']);
Route('put', 'VacationController.update').middleware(['jwt']);
Route('delete', 'VacationController.delete').middleware(['jwt']);

// Type Permissions
Route('get', 'TypePermissionController.index').middleware(['jwt']);
Route('post', 'TypePermissionController.store').middleware(['jwt']);
Route('put', 'TypePermissionController.update').middleware(['jwt']);

// Permissions
Route('get', 'PermissionController.index').middleware(['jwt', 'entityId']);
Route('post', 'PermissionController.store').middleware(['jwt', 'entityId']);
Route('put', 'PermissionController.update').middleware(['jwt', 'entityId']);
Route('delete', 'PermissionController.delete').middleware(['jwt', 'entityId']);

// License
Route('post', 'LicenseController.store').middleware(['jwt', 'entityId']);
Route('put', 'LicenseController.update').middleware(['jwt', 'entityId']);
Route('delete', 'LicenseController.delete').middleware(['jwt', 'entityId']);

// Ascents
Route('post', 'AscentController.store').middleware(['jwt', 'entityId']);
Route('put', 'AscentController.update').middleware(['jwt', 'entityId']);
Route('delete', 'AscentController.delete').middleware(['jwt', 'entityId']);

// Displacements
Route('post', 'DisplacementController.store').middleware(['jwt', 'entityId']);
Route('put', 'DisplacementController.update').middleware(['jwt', 'entityId']);
Route('delete', 'DisplacementController.delete').middleware(['jwt', 'entityId']);

// Discount
Route('get', 'DiscountController.preView').middleware(['jwt', 'entityId']);
Route('get', 'DiscountController.preViewDetails').middleware(['jwt', 'entityId']);
Route('post', 'DiscountController.process').middleware(['jwt', 'entityId']);