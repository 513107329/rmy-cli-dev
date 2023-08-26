'use strict';

module.exports = formatPath;

const path = require('path')

function formatPath(path) {
	const sep = path.sep;
	if(path && typeof path === 'string') {
		if(sep === '/') {
			return path
		} else {
			return path.replace(/\\/, '/')
		}
	}

	return path
}
