const GitServer = require("./gitServer");

class Github extends GitServer {
    constructor() {
        super('github')
    }
}

module.exports = Github