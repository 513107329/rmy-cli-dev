'use strict';
const pkg = require('../package.json');
const userHome = require('user-home');
const semver = require('semver');
const pathExists = require('path-exists');
const colors = require('colors/safe');
const { DEFAULT_CLI_HOME, REGISTRY } = require('./const');
const log = require('@rmy-cli-dev/logger');
// const initCommand = require('@rmy-cli-dev/init');
const path = require('path');
const commander = require('commander');
const { getNpmSemverVersions } = require('get-npm-info');
const exec = require('@rmy-cli-dev/exec');

let args, configs;

function core() {
	// 待处理  将这种模式修改为lerna命令行的模式

	let chain = Promise.resolve();
	chain = chain.then(checkPkgVersion);
	chain = chain.then(checkRoot);
	chain = chain.then(checkUserHome);
	// chain = chain.then(checkInputArgs);
	chain = chain.then(checkENV);
	chain = chain.then(initializeCommand);
	chain.catch(error => {
		log.error('errors', error.message)
	})
}

async function checkPkgVersion() {
	await checkGlobalUpdate();
	log.info('version', pkg.version)
}

function checkRoot() {
	const rootCheck = require('root-check');
	rootCheck();
	log.info('info', 'downgrade success')
}

function checkUserHome() {
	 if(!userHome || !pathExists(userHome)) {
		throw new Error(colors.red('当前登录用户主目录不存在'))
	 }
}

function checkInputArgs() {
	const minimist = require('minimist');
	args = minimist(process.argv.slice(2));
	checkArgs(args)
}

function checkArgs(args) {
	const LOG_LEVEL = args.debug ? 'verbose' : 'info'
	process.env.LOG_LEVEL = log.level = LOG_LEVEL
	log.verbose('verbose', '开启调试模式')
}

function checkENV() {
	const dotenv = require('dotenv');
	const dotenvPath = path.join(userHome, '.env');
	if(pathExists(dotenvPath)) {
		dotenv.config({
			path: dotenvPath
		});
	}
	createDefaultConfig();
	log.verbose('env', process.env.CLI_HOME_PATH)
}

function createDefaultConfig() {
	const cliConfig = {
		home: userHome
	};
	cliConfig.cliHome = path.join(userHome, process.env.CLI_HOME || DEFAULT_CLI_HOME);
	process.env.CLI_HOME_PATH = cliConfig.cliHome
}

async function checkGlobalUpdate() {
	const { name, version } = pkg;
	const lastVersion = await getNpmSemverVersions(version, name, REGISTRY);
	if(lastVersion && semver.gt(lastVersion, version)) {
		return log.warn('update tip', colors.yellow(`please update package ${name}, current version is ${version}, last version is ${lastVersion}
更新命令：npm install -g ${name}`))
	}
}

const program = new commander.Command();

function initializeCommand() {
	program
		.name(Object.keys(pkg.bin)[0])
		.version(pkg.version)
		.option('-d, --debug', '开启调试模式', false)
		.option('-tp, --targetPath <targetPath>', '目标路径', '')
		.option('-pn, --packageName <packageName>', '远程下载包名', '')
	
	// registerCommand(initCommand)
	registerCommand({
		command: 'init <pkgName>',
		description: 'init project',
		options: [
			{ name: '-f, --force', description: 'force init project' }
		],
		action() {
			exec.apply(null, arguments)
		}
	})

	program.on('option:debug',function() {
		if(this.opts().debug) {
			process.env.LOG_LEVEL = 'verbose'
		} else {
			process.env.LOG_LEVEL = 'info'
		}
		log.level = process.env.LOG_LEVEL
		log.verbose('debug', '开启调试模式')
	})

	program.on('option:targetPath',function() {
		if(this.opts().targetPath) {
			process.env.TARGET_PATH = this.opts().targetPath
		}
	})

	program.on('option:packageName',function() {
		if(this.opts().packageName) {
			process.env.PACKAGE_NAME = this.opts().packageName
		}
	})

	program.on('command:*',function() {
		const availableCommands = program.commands.map(item => item.name());
		log.info('command', colors.red(`未知命令：${this.args[0]}`));
		log.info('command', colors.red(`可用命令：${availableCommands.join(' , ')}`));
	})

	program.parse(process.argv)


	if(program.args && program.args.length < 1) {
		program.outputHelp()
	}
}

function registerCommand(command) {
	let init = program.command(command.command)
	init = init.description(command.description)
	command.options && command.options.forEach(option => {
		init = init.addOption(new commander.Option(option.name, option.description))
	})
	init = init.action(command.action)
}

module.exports = core;