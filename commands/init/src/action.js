const Command = require("@rmy-cli-dev/command")
const exec = require("@rmy-cli-dev/exec")

class InitCommand extends Command {
	initialize() {
		console.log('initialize', this.pkgName, this.options)
	}

	execute() {
		exec(...this.args)
	}
}

function factory(...args) {
	return new InitCommand(...args)
}

 module.exports = factory