const pkgdir = require('pkg-dir').sync
const path = require('path')
const formatpath = require('@rmy-cli-dev/format-path')
const { getDefaultRegistry, getNpmLatestVersions } = require('@rmy-cli-dev/get-npm-info')
const pathExists = require('path-exists')
const npminstall = require('npminstall')
const log = require('@rmy-cli-dev/logger')
const semver = require('semver')
const { mkdirpSync } = require('fs-extra')

class Package {
	constructor(options) {
		if(!options) {
			throw new Error('options should not be empty!')
		}
		if(Object.prototype.toString.call(options) !== '[object Object]') {
			throw new Error('options should be object!')
		}
		this.targetPath = options.targetPath
		this.storePath = options.storePath
		this.packageName = options.name
		this.packageVersion = options.version
	}

	async prepare() {
		if(this.storePath && !pathExists(this.storePath)) {
			mkdirpSync(this.storePath)
		}

		if(this.packageVersion === 'latest') {
			const version = await getNpmLatestVersions(this.packageName);
			this.packageVersion = version
		}
	}

	async exists() {
		await this.prepare();
		if(pathExists.sync(this.cacheFilePath)) return true
		return false
	}

	async install() {
		await npminstall({
			root: this.targetPath,
			storeDir: this.storePath,
			registry: getDefaultRegistry(),
			pkgs: [
				{ name: this.packageName, version: this.packageVersion }
			]
		})
		log.info('npminstall', 'install success')
	}

	get cacheFilePath() {
		return path.resolve(this.storePath, this.packageName);
	}

	async update() {
		const pkgFile = require(path.resolve(this.cacheFilePath, 'package.json'));
		if(pkgFile && pkgFile.version) {
			if(semver.lt(pkgFile.version, this.packageVersion)) {
				await npminstall({
					root: this.targetPath,
					storeDir: this.storePath,
					registry: getDefaultRegistry(),
					pkgs: [
						{ name: this.packageName, version: this.packageVersion }
					]
				})
				log.info('npminstall', 'update success')
			}
		}
	}
	_getFilePath(filePath) {
		const dir = pkgdir(filePath);
		if(dir) {
			const pkgPath = path.resolve(dir, 'package.json')
			const pkgFile = require(pkgPath);
			if(pkgFile && pkgFile.main) {
				return formatpath(path.resolve(dir, pkgFile.main))
			}
		}
		return null
	}
	getEntryFile() {
		if(this.storePath) {
			return this._getFilePath(this.cacheFilePath)
		} else {
			return this._getFilePath(this.targetPath)
		}
	}
}

module.exports = Package