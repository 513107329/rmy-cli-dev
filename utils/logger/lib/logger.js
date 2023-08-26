'use strict';
const log = require('npmlog');

function logger() {
	const level = process.env.LOG_LEVEL || 'info';
	log.level = level;
	log.heading = 'rmy';
  log.headingStyle = { fg: 'red', bg: 'black' };
	return log
}

module.exports = logger();
