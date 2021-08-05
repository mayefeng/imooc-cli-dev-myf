'use strict';

module.exports = core;

const pkg = require('../package.json');
const log = require('@imooc-cli-dev-myf/log')

function core() {
    checkPkgVersion()
}

function checkPkgVersion() {
    // console.log(pkg.version)
    // log.success('test', 'success...');
    // log.verbose('debug', 'debug...')
    log.notice('cli', pkg.version)
}
