'use strict';

// function init(projectName, cmdobj, command) {
function init(argv) {
    // console.log('init', projectName, cmdobj.force, command.parent.targetPath)
    // console.log(process.env.CLI_TARGET_PATH)
    return new InitCommand(argv)
}

const fs = require('fs')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const Command = require('@imooc-cli-dev-myf/command')
const log = require('@imooc-cli-dev-myf/log')

class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._cmd.force
        log.verbose('projectName',this.projectName)
        log.verbose('force', this.force)
    }

    async exec() {
        try {
            // 1、准备阶段
            const ret = await this.prepare()
            if (ret) {
                // 2、下载模板
                // 3、安装模板
            }
        } catch (e) {
            log.error(e.message)
        }
    }

    async prepare() {
        const localPath = process.cwd() // 当前进程的目录，即跑命令的目录
        // 1、判断当前目录是否为空
        if(!this.isDirEmpty(localPath)) {
            let ifContinue = false
            if (!this.force) {
                // 1.1 询问是否继续创建
                ifContinue = (await inquirer.prompt({
                    type: 'confirm',
                    name: 'ifContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目？'
                })).ifContinue
                if (!ifContinue) {
                    return
                }
            }
            if (ifContinue || this.force) {
                // 给用户做二次确认
                const { confirmDelete } = await inquirer.prompt({
                    type: 'confirm',
                    name: 'confirmDelete',
                    default: false,
                    message: '是否确认清空当前目录下的文件？'
                })
                if (confirmDelete) {
                    // 清空当前目录
                    // fse.removeSync() // 这个是删除当前文件夹
                    fse.emptyDirSync(localPath)
                }
            }
        }
        // 2、是否启动强制更新 
        // 3、选择创建项目或组件
        // 4、获取项目基本信息
    }

    isDirEmpty(localPath) {
        // console.log(localPath)
        // 或者这样也能拿到
        // console.log(path.resolve('.'))
        // __dirname是当前文件所在的文件夹
        // console.log(__dirname)
        let fileList = fs.readdirSync(localPath)
        // 文件过滤逻辑
        fileList = fileList.filter(file => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
        ))
        // console.log(fileList)
        return !fileList || fileList.length <= 0
    }
}

module.exports = init;
module.exports.InitCommand = InitCommand
