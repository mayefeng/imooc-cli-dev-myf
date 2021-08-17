'use strict';

module.exports = exec;

const path = require('path')
const Package = require('@imooc-cli-dev-myf/package')
const log = require('@imooc-cli-dev-myf/log')

const SETTINGS = {
    // init: '@imooc-cli-dev-myf/init'
    init: '@imooc-cli/init'
}

const CACHE_DIR = 'dependencies/'

async function exec() {
    let targetPath = process.env.CLI_TARGET_PATH
    const homePath = process.env.CLI_HOME_PATH
    let storeDir = ''
    let pkg
    log.verbose('targetPath', targetPath)
    log.verbose('homePath', homePath)

    // console.log(arguments)
    const cmdobj = arguments[arguments.length - 1]
    // console.log(cmdobj.opts().force)
    // console.log(cmdobj.name())
    const cmdName = cmdobj.name() // 可以做一个映射表把我们的init映射到具体的package
    const packageName = SETTINGS[cmdName]
    const packageVersion = 'latest'
    // const packageVersion = '1.1.0'

    if (!targetPath) {
        // 生成缓存路径
        targetPath = path.resolve(homePath, CACHE_DIR)
        storeDir = path.resolve(targetPath, 'node_modules')
        log.verbose('targetPath', targetPath)
        log.verbose('storeDir', storeDir)
        pkg = new Package({
            targetPath,
            storeDir,
            packageName,
            packageVersion
        })
        if(await pkg.exists()) {
            // 更新package
            await pkg.update()
        } else {
            // 安装package
            await pkg.install()
        }
    } else {
        pkg = new Package({
            targetPath,
            storeDir,
            packageName,
            packageVersion
        })
        // console.log(pkg.getRootFilePath())
        // 1.targetPath -> modulePath
        // 2.modulePath -> Package(npm模块)
        // 3.Package.getRootFile(获取入口文件)

        // 封装 -> 复用
    }
    const rootFile = pkg.getRootFilePath()
    console.log(rootFile)
    if (rootFile) {
        // apply这里作用是把数组转为参数列表形式
        require(rootFile).apply(null, arguments)
    }

}
