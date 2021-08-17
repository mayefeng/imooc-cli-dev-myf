'use strict';
const path = require('path')
const fse = require('fs-extra')
const pkgDir = require('pkg-dir').sync
const pathExists = require('path-exists').sync
const npminstall = require('npminstall')
const { isObject } = require('@imooc-cli-dev-myf/utils')
const formatPath = require('@imooc-cli-dev-myf/format-path')
const { getDefaultRegisry, getNpmLastestVersion } = require('@imooc-cli-dev-myf/get-npm-info')

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
        this.storeDir = options.storeDir // 放外部判断，如果没有targetPath就生成缓存路径赋值给targetPath
        // package的name
        this.packageName = options.packageName
        // package的version
        this.packageVersion = options.packageVersion
        // package的缓存目录前缀
        this.cacheFilePathPrefix = this.packageName.replace('/', '_')
    }

    async prepare() {
        if (this.storeDir && !pathExists(this.storeDir)) {
            // 把当前目录下没有创建的姆目录全部创建好
            fse.mkdirpSync(this.storeDir)
        }
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLastestVersion(this.packageName)
        }
    }

    get cacheFilePath() {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }

    getSpeficCacheFilePath(packageVersion) {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`)
    }

    // 判断当前package是否存在
    async exists() {
        console.log('this.storeDir',this.storeDir)
        if (this.storeDir) {
            await this.prepare()
            console.log(this.cacheFilePath)
            console.log(pathExists(this.cacheFilePath))
            return pathExists(this.cacheFilePath)
        } else {
            return pathExists(this.targetPath)
        }
    }

    // 安装Package
    async install() {
        await this.prepare()
        return npminstall({
            // 模块路径
            root: this.targetPath,
            // 实际存储的位置
            storeDir: this.storeDir,
            registry: getDefaultRegisry(),
            pkgs: [
                {
                    name: this.packageName, 
                    version: this.packageVersion
                }
            ],
        })
    }

    // 更新Package
    async update() {
        console.log('update')
        await this.prepare()
        // 1. 获取最新的npm模块版本号
        const latestPackageVersion = await getNpmLastestVersion(this.packageName)
        // 2. 查询最新版本号对于的路径是否存在
        const latestFilePath = this.getSpeficCacheFilePath(latestPackageVersion)
        // 3. 如果不存在，则直接安装最新版本
        if (!pathExists(latestFilePath)) {
            await npminstall({
                // 模块路径
                root: this.targetPath,
                // 实际存储的位置
                storeDir: this.storeDir,
                registry: getDefaultRegisry(),
                pkgs: [
                    {
                        name: this.packageName, 
                        version: latestPackageVersion
                    }
                ],
            })
            this.packageVersion = latestPackageVersion
        }
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
