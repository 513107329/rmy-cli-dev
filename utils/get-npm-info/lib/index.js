'use strict';
const urlJoin = require('url-join');
const { Axios } = require('axios');
const semver = require('semver');

async function getNpmInfo(npmName, registry) {
	if(!npmName) return null;
	registry = registry || getDefaultRegistry();
	const url = urlJoin(registry, npmName);
	const axios = new Axios({ responseType: 'json' });
	try {
		const result = await axios.get(url);
		if(result.status === 200) {
			return result.data
		} else {
			return null
		}
	} catch(e) {
		throw e
	}
}

async function getNpmVersions(npmName, registry) {
	const result = await getNpmInfo(npmName, registry);
	if(result) {
		return Object.keys(JSON.parse(result).versions)
	}
	return []
}

function getSemverVersions(baseVersion, versions) {
	versions = versions
		.filter(version => semver.satisfies(version, `>${baseVersion}`))
		.sort((a, b) => {
			const isSort = semver.gt(b, a);
			if(isSort) {
				return 1
			}else if(!isSort) {
				return -1
			}
		});
	return versions
}

async function getNpmSemverVersions(baseVersion, npmName, registry) {
	const versions = await getNpmVersions(npmName, registry);
	const semverVersions = getSemverVersions(baseVersion, versions);
	if(semverVersions && semverVersions.length) return semverVersions[0]
	return null
}

async function getNpmLatestVersions(npmName, registry) {
	const versions = await getNpmVersions(npmName, registry);
	const searchVersions = versions
	.sort((a, b) => {
		const isSort = semver.gt(b, a);
		if(isSort) {
			return 1
		}else if(!isSort) {
			return -1
		}
	});
	if(searchVersions && searchVersions.length) return searchVersions[0]
	return null
}

function getDefaultRegistry(isOriginal = true) {
	return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npmjs.taobao.org'
}

module.exports = { getNpmInfo, getNpmVersions, getNpmSemverVersions, getNpmLatestVersions, getSemverVersions, getDefaultRegistry };