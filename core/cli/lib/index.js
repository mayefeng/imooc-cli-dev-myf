'use strict';

module.exports = core;

const path = require('path')
const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const log = require('@imooc-cli-dev-myf/log')

const pkg = require('../package.json');
const constant = require('./const');
const getNpmInfo = require('@imooc-cli-dev-myf/get-npm-info');

let args, config;

async function core() {
    try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkInputArgs()
    checkEnv()
    await checkGlobalUpdate()
    // log.verbose('debug', 'test debug log')
    } catch (e) {
        log.error(e.message)
    }
}

async function checkGlobalUpdate() {
    // 1.获取当前版本号和模块名
    const currentVersion = pkg.version;
    const npmName = pkg.name
    // 2、调用npm API，获取所有版本号
    const { getNpmSemverVersion } = require('@imooc-cli-dev-myf/get-npm-info')
    const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
        log.warn('更新提示', colors.yellow(`
        请手动更新 ${npmName}， 当前版本：${currentVersion}，最新版本${lastVersion}
        更新命令：npm install -g ${npmName}`))
    }
    // 3.提取所有版本号，比对哪些版本号大于当前版本号
    // 4.获取最新的版本号，提示用户更新到该版本
}

function checkEnv() {
    const dotenv = require('dotenv')
    const dotenvPath = path.resolve(userHome, '.eno')
    if (pathExists(dotenvPath)) {
        config = dotenv.config({
            path: dotenvPath
        })
        console.log('config', config)
    }
    // 第一种方案
    // config = createDefaultConfig()
    // log.verbose('环境变量', config)

    // 第二种方案
    createDefaultConfig()
    log.verbose('环境变量', process.env.CLI_HOME_PATH)
}

function createDefaultConfig() {
    const cliConfig = {
        home: userHome
    }
    if (process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    } else {
        cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
    }
    // 第一种方案
    // return cliConfig
    // 第二种方案
    process.env.CLI_HOME_PATH = cliConfig.cliHome
}

function checkInputArgs() {
    const minimist = require('minimist')
    args = minimist(process.argv.slice(2))
    checkArgs()
}

function checkArgs() {
    if(args.debug) {
        process.env.LOG_LEVEL = 'verbose'
    } else {
        process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
}

function checkUserHome() {
    if (!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前登录用户主目录不存在！'))
    }
}

function checkRoot() {
    const rootCheck = require('root-check')
    rootCheck()
}

function checkNodeVersion() {
    // 第一步，获取当前Node版本号
    const currentVersion = process.version
    // 第二步，比对最低版本号
    const lowestNodeVersion = constant.LOWEST_NODE_VERSION

    if (!semver.gte(currentVersion, lowestNodeVersion)) {
        throw new Error(colors.red(`imooc-cli 需要安装 v${lowestNodeVersion}以上版本的 Node.js` ))
    }
}

function checkPkgVersion() {
    // console.log(pkg.version)
    // log.success('test', 'success...');
    // log.verbose('debug', 'debug...')
    log.notice('cli', pkg.version)
}
