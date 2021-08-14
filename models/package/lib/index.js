'use strict';

const { isObject } = require('@imooc-cli-dev-myf/utils')

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
        this.storePath = options.storePath
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

    }
}
module.exports = Package;
