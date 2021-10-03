const GitServer = require("./gitServer");

class Gitee extends GitServer {
    constructor() {
        super('gitee')
    }
}

module.exports = Gitee