'use strict';

// function init(projectName, cmdobj, command) {
function init(argv) {
    // console.log('init', projectName, cmdobj.force, command.parent.opts().targetPath)
    // console.log(process.env.CLI_TARGET_PATH)
    return new InitCommand(argv)
}

const Command = require('@imooc-cli-dev-myf/command')
const log = require('@imooc-cli-dev-myf/log')

class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._cmd.opts().force
        log.verbose('projectName',this.projectName)
        log.verbose('force', this.force)
    }

    exec() {
        console.log('init的业务网逻辑')
    }
}

module.exports = init;
module.exports.InitCommand = InitCommand
