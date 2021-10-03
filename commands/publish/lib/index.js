'use strict';

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')
const Command = require('@imooc-cli-dev-myf/command')
const log = require('@imooc-cli-dev-myf/log')
const Git = require('@imooc-cli-dev-myf/git')

class PublishCommand extends Command {
    init() {
        // 处理参数
        // console.log('publish', this._argv, this._cmd)
        this.options = { 
            refreshServer: this._cmd.refreshServer,
            refreshToken: this._cmd.refreshToken
        }
    }

    async exec() {
        try {
            const startTime = new Date().getTime()
            // 1.初始检查
            this.prepare()
            // 2.Git Flow自动化
            const git = new Git(this.projectInfo, this.options)
            await git.prepare()
            // 3.云构建和云发布
            const endTime = new Date().getTime()
            log.info('本次发布耗时：', Math.floor(endTime - startTime) / 1000 + '秒')
        } catch (e) {
            log.error(e.message)
            if (process.env.LOG_LEVEL === 'verbose') {
                console.log(e)
            } 
        }
    }

    prepare() {
        // 1.确认项目是否为npm项目
        const projectPath = process.cwd()
        const pkgPath = path.resolve(projectPath, 'package.json')
        log.verbose('package.json', pkgPath)
        if (!fs.existsSync(pkgPath)) {
            throw new Error('package.json不存在')
        }
        // 2.确认是否包含name、version、build命令
        const pkg = fse.readJsonSync(pkgPath)
        const { name, version, scripts } = pkg
        log.verbose('package.json', name, version, scripts)
        if (!name || !version || !scripts || !scripts.build) {
            throw new Error('package.json信息不全，请检查是否存在name、version和scripts（需提供Build命令）')
        }
        this.projectInfo = {
            name, version, dir: projectPath
        }
    }
}

function init(argv) {
    return new PublishCommand(argv)
}

module.exports = init;
module.exports.PublishCommand = PublishCommand
