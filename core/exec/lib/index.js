'use strict';

module.exports = exec;

const Package = require('@imooc-cli-dev-myf/package')
const log = require('@imooc-cli-dev-myf/log')

const SETTINGS = {
    init: '@imooc-cli-dev-myf/init'
}

function exec() {
    const targetPath = process.env.CLI_TARGET_PATH
    const homePath = process.env.CLI_HOME_PATH
    log.verbose('targetPath', targetPath)
    log.verbose('homePath', homePath)

    // console.log(arguments)
    const cmdobj = arguments[arguments.length - 1]
    console.log(cmdobj.opts().force)
    console.log(cmdobj.name())
    const cmdName = cmdobj.name() // 可以做一个映射表把我们的init映射到具体的package
    const packageName = SETTINGS[cmdName]
    const packageVersion = 'lastest'

    if (!targetPath) {
        // 生成缓存路径
        targetPath = ''
    }

    const pkg = new Package({
        targetPath,
        packageName,
        packageVersion
    })
    console.log(pkg.getRootFilePath())
    // 1.targetPath -> modulePath
    // 2.modulePath -> Package(npm模块)
    // 3.Package.getRootFile(获取入口文件)

    // 封装 -> 复用
}
