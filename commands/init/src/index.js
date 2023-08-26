const command = {
	command: 'init <pkgName>',
	description: 'init project',
	options: [
		{ name: '-f, --force', description: 'force init project' }
	],
	action() {
		require('./action')(...arguments)
	}
}

module.exports = command;