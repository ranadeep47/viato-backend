var config = require('../config')[process.env['NODE_ENV']];
global.config = config;

var logger = require('../services/logger');

// logger.log('error', 'Hello logs');
// //
// logger.error('Daman error', {name : 'Ranadeep'});

throw new Error('WTF haha');
