const Package = require('@rmy-cli-dev/package')
const log = require('@rmy-cli-dev/logger')
const path = require('path')
const cp = require('child_process')

const CACHE_DIR = 'dependencies'

async function exec() {
	let targetPath = process.env.TARGET_PATH
	let storePath = ''
	const packageName = process.env.PACKAGE_NAME
	const homePath = process.env.CLI_HOME_PATH
	let package = null;
	log.verbose('targetPath', targetPath)
	log.verbose('homePath', homePath)
	log.verbose('packageName', packageName)
	if(!targetPath) {
		targetPath = path.resolve(homePath, CACHE_DIR)
		storePath = path.resolve(targetPath, 'node_modules')
		package = new Package({ targetPath, storePath, name: packageName, version: 'latest' });
		if(await package.exists()) {
			await package.update()
		} else {
			await package.install();
		}
	} else {
		package = new Package({ targetPath, name: packageName, version: 'latest' });
	}
	try {
		const args = [...arguments];
		const cmd = args[args.length - 1];
		const newCmd = Object.create(null);
		for(let key in cmd) {
			if(!key.startsWith('_') && cmd.hasOwnProperty(key) && key !== 'parent') {
				newCmd[key] = cmd[key]
			}
		}
		args[args.length - 1] = newCmd
		const code = `require('${package.getEntryFile()}').call(null, ${JSON.stringify(args)})`
		spawn('node', ['-e', code], {
			cwd: process.cwd(),
			stdio: "inherit"
		});
	} catch(e) {
		console.log(e)
		log.error('exec', e.message)
	}
}

function spawn(cmd, args, options) {
	const isWin = process.platform === 'win32'
	cmd = isWin ? 'cmd' : cmd
	args = isWin ? ['/c'].concat(args) : args
	const child = cp.spawn(cmd, args, options);
	child.on('error', e => {
		log.error('child', e.message)
	})
	child.on('exit', e => {
		log.verbose('exit', e)
	})
}

module.exports = exec;