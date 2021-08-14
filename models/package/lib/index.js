'use strict';
const path = require('path')
const pkgDir = require('pkg-dir').sync

const { isObject } = require('@imooc-cli-dev-myf/utils')
const formatPath = require('@imooc-cli-dev-myf/format-path')

class Package{
    constructor(options) {
        if (!options) {
            throw new Error('Package类的options参数不能为空！')
        }
        if (!isObject(options)) {
            throw new Error('Package类的options参数必须为对象！')
        }
        // package路径，不传的时候表示这不是一个本地的package
        this.targetPath = options.targetPath
        // package的存储路径，因为我们从远程下载package之后，需要把他存到本地
        // this.storePath = options.storePath // 放外部判断，如果没有targetPath就生成缓存路径赋值给targetPath
        // package的name
        this.packageName = options.packageName
        // package的version
        this.packageVersion = options.packageVersion
    }

    // 判断当前package是否存在
    exists() {

    }

    // 安装Package
    install() {

    }

    // 更新Package
    update() {

    }

    // 获取入口文件的路径
    getRootFilePath() {
        // 1、获取package.json所在的目录
            // 可能他传过来的targetPath没有package.json不是我们的主目录
            // pkg-dir来实现
        const dir = pkgDir(this.targetPath)
        if (dir) {
            // 2、读取package.json - require()  js/json/node
            const pkgFile = require(path.resolve(dir, 'package.json'))
            // 3、寻找main/lib - path
            if (pkgFile && pkgFile.main) {
                // 4、路径的兼容（macOS/windows）
                return formatPath(path.resolve(dir, pkgFile.main))
            }
            return null
        }
        return null

    }
}
module.exports = Package;
