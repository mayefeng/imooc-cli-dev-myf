const request = require('@imooc-cli-dev-myf/request')

module.exports = function() {
    return request({
        url: '/project/template',
    })
}