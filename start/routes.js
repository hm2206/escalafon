'use strict'

const Route = require('../app/Services/route');

// Clocks
Route('get', 'ClockController.index').middleware(['jwt', 'entityId']);
Route('post', 'ClockController.store').middleware(['jwt', 'entityId']);

// config Assistance
Route('post', 'ConfigAssistanceController.store').middleware(['jwt', 'entityId']);

// Assistance
Route('get', 'AssistanceController.index').middleware(['jwt', 'entityId']);
Route('post', 'AssistanceController.store').middleware(['jwt', 'entityId']);