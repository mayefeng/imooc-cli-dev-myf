'use strict';

const path = require('path')

module.exports = function formatPath(p) {
    if (p) {
        const sep = path.sep;
        // 这个sep在macOS上返回的是/，而在windows上返回的是\
        if (sep === '/') {
            return p
        } else {
            return p.replace(/\\/g, '/')
        }
    }
    return p
}
