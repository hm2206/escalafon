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
Route('get', 'WorkController.degrees').middleware(['jwt']);
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
Route('get', 'InfoController.ascents').middleware(['jwt', 'entityId']);
Route('get', 'InfoController.displacements').middleware(['jwt', 'entityId']);
Route('get', 'InfoController.merits').middleware(['jwt', 'entityId']);

// Clocks
Route('get', 'ClockController.index').middleware(['jwt', 'entityId']);
Route('post', 'ClockController.store').middleware(['jwt', 'entityId']);

// Schedules
Route('post', 'ScheduleController.store').middleware(['jwt', 'entityId']);
Route('put', 'ScheduleController.update').middleware(['jwt', 'entityId']);
Route('delete', 'ScheduleController.delete').middleware(['jwt', 'entityId']);
Route('post', 'ScheduleController.replicar').middleware(['jwt', 'entityId']);
Route('put', 'ScheduleController.isEdit').middleware(['jwt', 'entityId']);

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

// Merit
Route('post', 'MeritController.store').middleware(['jwt', 'entityId']);
Route('put', 'MeritController.update').middleware(['jwt', 'entityId']);
Route('delete', 'MeritController.delete').middleware(['jwt', 'entityId']);

// TypeDegree
Route('get', 'TypeDegreeController.index').middleware(['jwt']);

// Degree
Route('post', 'DegreeController.store').middleware(['jwt', 'entityId']);
Route('put', 'DegreeController.update').middleware(['jwt', 'entityId']);
Route('delete', 'DegreeController.delete').middleware(['jwt', 'entityId']);

// File
Route('post', 'FileController.store').middleware(['jwt'])
Route('get', 'FileController.objectType').middleware(['jwt'])
Route('get', 'FileController.binary').middleware(['jwt'])

// Configs Discounts
Route('get', 'ConfigDiscountController.index').middleware(['jwt', 'entityId']);
Route('post', 'ConfigDiscountController.store').middleware(['jwt', 'entityId']);
Route('get', 'ConfigDiscountController.show').middleware(['jwt', 'entityId']);
Route('post', 'ConfigDiscountController.processDiscounts').middleware(['jwt', 'entityId']);
Route('get', 'ConfigDiscountController.discounts').middleware(['jwt', 'entityId']);
Route('get', 'ConfigDiscountController.headDiscounts').middleware(['jwt', 'entityId']);
Route('put', 'ConfigDiscountController.verified').middleware(['jwt', 'entityId']);
Route('put', 'ConfigDiscountController.accepted').middleware(['jwt', 'entityId']);

// Reports
Route('get', 'ReportController.general').middleware(['jwt', 'entityId']);
Route('get', 'ReportController.onomastico').middleware(['jwt', 'entityId']);
Route('get', 'ReportController.ballots').middleware(['jwt', 'entityId']);
Route('get', 'ReportController.licenses').middleware(['jwt', 'entityId']);
Route('get', 'ReportController.vacations').middleware(['jwt', 'entityId']);
Route('get', 'ReportController.vacationBasics').middleware(['jwt', 'entityId']);
Route('get', 'ReportController.discounts').middleware(['jwt', 'entityId']);
Route('get', 'ReportController.infos').middleware(['jwt', 'entityId']);
Route('get', 'ReportController.schedules').middleware(['jwt', 'entityId']);