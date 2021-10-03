const GitServer = require("./gitServer");

class Github extends GitServer {
    constructor() {
        super('github')
    }

    getSSHKeysUrl() {
        return 'https://github.com/settings/keys'
    }
    
    getTokenHelpUrl() {
        return 'https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh'
    }
}

module.exports = Github