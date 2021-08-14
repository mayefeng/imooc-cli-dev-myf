'use strict';

function init(projectName, cmdobj, command) {
    console.log('init', projectName, cmdobj.force, command.parent.opts().targetPath)
    console.log(process.env.CLI_TARGET_PATH)
}

module.exports = init;
