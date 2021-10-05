'use strict';

const io = require('socket.io-client')

const WS_SERVER = 'http://127.0.0.1:7001'
// const WS_SERVER = 'http://book.youbaobao.xyz:7001'
const TIME_OUT = 5 * 60
class CloudBuild {
    constructor(git, options) {
        this.git = git
        this.buildCmd = options.buildCmd
        this.timeout = TIME_OUT
    }

    init() {
        this.socket = io(WS_SERVER, {
            query: {
                repo: this.git.remote,
            }
        })
        this.socket.on('connect', () => {
            console.log('connect')
        })
    }
}

// or http://127.0.0.1:7001/chat
// const socket = require('socket.io-client')('http://127.0.0.1:7001');

// socket.on('connect', () => {
//   console.log('connect!');
//   socket.emit('chat', 'hello world!');
// });

// socket.on('res', msg => {
//   console.log('res from server: %s!', msg);
// });

module.exports = CloudBuild;
