const cloneDeep = require('clone-deep')
const semver = require('semver')
const colors = require('colors')
const log = require('@rmy-cli-dev/logger')

const LOWEST_NODE_VERSION = '14.0.0'

class Command {
	constructor(argv) {
		if(!argv || !argv.length) {
			throw new Error('参数不能为空')
		}
		this._args = cloneDeep(argv)
		const runner = new Promise((resolve, reject) => {
			let chain = Promise.resolve();
			chain = chain.then(() => this.checkNodeVersion());
			chain = chain.then(() => this.initArgs());
			chain.then(() => this.runCommand());
			chain.catch(e => {
				log.error('command', e.message)
			})
		})
	}

	checkNodeVersion() {
		const currentVersion = process.version;
		if(!semver.gte(currentVersion, LOWEST_NODE_VERSION)) {
			throw new Error(colors.red(`node环境版本需要大于 v${LOWEST_NODE_VERSION}`))
		} else {
			log.info('node version', currentVersion)
		}
	}

	initArgs() {
		this._cmd = this._args[this._args.length - 1]
		this._args = this._args.slice(0, this._args.length - 1)
	}

	initialize() {
    throw new Error(`${this.name} initialize() needs to be implemented.`);
  }

	execute() {
    throw new Error(`${this.name} execute() needs to be implemented.`);
  }

	runCommand() {
		this.initialize()
		this.execute()
	}
}

module.exports = Command