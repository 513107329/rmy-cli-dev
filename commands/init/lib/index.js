const Command = require("@rmy-cli-dev/command")
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const inquirer = require('inquirer')
const log = require('@rmy-cli-dev/logger')
const fse = require('fs-extra')
const semver = require('semver')

const { TYPE_PROJECT, TYPE_COMPONENT } = require('./const')

const readdir = promisify(fs.readdir)
const mkdir = promisify(fs.mkdir)

class InitCommand extends Command {
	initialize() {
		this.projectName = this._args[0] || ''
		this.force = !!this._args[1].force
		this._name = 'init'
		this.projectPath = path.resolve(process.cwd(), this.projectName)
	}

	async execute() {
		try {
			await this.prepare()
			this.downloadTemplate()
		} catch(e) {
			log.error(e.message)
		}
	}

	async downloadTemplate() {

	}

	async prepare() {
		this.prepareProjectDir()
		this.getProjectInfo()
	}

	async prepareProjectDir() {
		const exists = this.dirExists();
		const prompt = inquirer.createPromptModule()
		if(exists) {
			const fileList = await readdir(this.projectPath);
			if(!fileList || fileList.length !== 0) {
				let isContinue
				if(!this.force){
					isContinue = (await prompt({
						type: 'confirm',
						name: 'isContinue',
						message: 'confirm to continue create the project?'
					})).isContinue
				}
				if(!isContinue) {
					return
				}
				if(isContinue || this.force) {
					const { forceClean } = await prompt({
						type: 'confirm',
						name: 'forceClean',
						message: 'confirm clean up the dir?'
					})
					if(forceClean) {
						fse.emptyDirSync(this.projectPath)
					}
				} else {
					return;
				}
			}
		} else {
			await mkdir(this.projectPath);
		}
	}

	async getProjectInfo() {
		const prompt = inquirer.createPromptModule()
		const questions = [{
			type: 'list',
			name: 'type',
			choices: [{name: '项目', value: TYPE_PROJECT}, {name: '组件', value: TYPE_COMPONENT}],
			message: 'please select the type of your project',
			default: TYPE_PROJECT,
		}, {
			type: 'input',
			name: 'name',
			message: "please input the project's name",
			default: '',
			validate: function(value) {
				const done = this.async();
				const reg = /^[a-zA-Z]+([-_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/
				if(!value) {
					done('please input the project name')
					return
				}
				if(!reg.test(value)) {
					done('please input the regular project name')
					return
				}

				done(null, true)
			}
		}, {
			type: 'input',
			name: 'version',
			message: "please input the project's version",
			validate: function(value) {
				const done = this.async()
				const version = !!semver.valid(value)
				if(!version) {
					done("please input the regular project's version")
					return
				}

				done(null, true)
			},
			filter: function(value) {
				if(!!semver.valid(value)) {
					return semver.valid(value)
				} else {
					return value
				}
			}
		}]
		const answers = await prompt(questions)
		if(answers.type === TYPE_COMPONENT) {
			const {descrition} = await prompt({
				type: 'input',
				name: 'descrition',
				message: "please input the project's description",
			})
			answers.desc = descrition
		}
		console.log(answers)
	}

	dirExists() {
		let dirIsExists = false
		try {
			fs.accessSync(this.projectPath)
			dirIsExists = true
		} catch(e) {
			dirIsExists = false
		}
		return dirIsExists
	}
}

function factory(args) {
	return new InitCommand(args)
}

 module.exports = factory