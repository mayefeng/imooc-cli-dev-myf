'use strict';

const fs = require('fs')
const path = require('path')
const SimpleGit = require('simple-git')
const fse = require('fs-extra')
const userHome = require('user-home')
const inquirer = require('inquirer')
const terminalLink = require('terminal-link')
const log = require('@imooc-cli-dev-myf/log')
const { readFile, writeFile } = require('@imooc-cli-dev-myf/utils');
const Github = require('./Github');
const Gitee = require('./Gitee');

const DEFAULT_CLI_HOME = '.imooc-cli-dev-myf'
const GIT_ROOT_DIR = '.git'
const GIT_SERVER_FILE = '.git_server'
const GIT_TOKEN_FILE = '.git_token'
const GITHUB = 'github'
const GITEE = 'gitee'
const GITLAB = 'gitlab'

const GIT_SERVER_TYPE = [
    {
        name: 'Github',
        value: GITHUB
    },
    {
        name: 'Gitee',
        value: GITEE
    },
    {
        name: 'GitLab',
        value: GITLAB
    },
]

class Git {
    constructor({name, version, dir}, { 
        refreshServer = false,
        refreshToken = false
    }) {
        this.name = name
        this.version = version
        this.dir = dir
        this.git = SimpleGit(dir)
        this.gitServer = null
        this.homePath = null
        this.user = null
        this.orgs = null
        this.refreshServer = refreshServer
        this.refreshToken = refreshToken
    }

    async prepare() {
        // 检查缓存主目录
        this.checkHomePath()
        // 检查用户远程仓库类型
        await this.checkGitServer()
        // 获取远程仓库token
        await this.checkGitToken()
        // 获取远程仓库用户和组织信息：帮助我们确认在创建仓库库的时候调用哪个api
        await this.getUserAndOrgs()
    }

    checkHomePath() {
        if (!this.homePath) {
            if (process.env.CLI_HOME_PATH) {
                this.homePath = process.env.CLI_HOME_PATH
            } else {
                this.homePath = path.resolve(userHome, DEFAULT_CLI_HOME)
            }
        }
        log.verbose('home', this.homePath)
        fse.ensureDirSync(this.homePath + 1)
        if (!fs.existsSync(this.homePath)) {
            throw new Error('用户主目录获取失败！')
        }
    }

    async checkGitServer() {
        const gitServerPath = this.createPath(GIT_SERVER_FILE)
        let gitServer = readFile(gitServerPath)
        if (!gitServer || this.refreshServer) {
            gitServer = (await inquirer.prompt({
                type: 'list',
                name: 'gitServer',
                message: '请选择您想要托管的Git平台',
                default: GITHUB,
                choices: GIT_SERVER_TYPE
            })).gitServer
            writeFile(gitServerPath, gitServer)
            log.success('git server写入成功', `${gitServer} -> ${gitServerPath}`)
        } else {
            log.success('git server获取成功', gitServer)
        }
        this.gitServer = this.createGitServer(gitServer)
        if (!this.gitServer) {
            throw new Error('GitServer初始化失败！')
        }
    }

    async checkGitToken() {
        const tokenPath = this.createPath(GIT_TOKEN_FILE)
        let token = readFile(tokenPath)
        if (!token || this.refreshToken) {
            log.warn(this.gitServer.type + ' token未生成', '请先生成' + this.gitServer.type + ' token，' + terminalLink('链接', this.gitServer.getTokenUrl()))
            token = (await inquirer.prompt({
                type: 'password',
                name: 'token',
                message: '请将token复制到这里',
                default: '',
            })).token
            writeFile(tokenPath, token)
            log.success('token写入成功', `${token} -> ${tokenPath}`)
        } else {
            log.success('token获取成功', tokenPath)
        }
        this.token = token
        this.gitServer.setToken(token)
    }

    async getUserAndOrgs() {
        this.user = await this.gitServer.getUser()
        if (!this.user) {
            throw new Error('用户信息获取失败！')
        }
        log.verbose('user', this.user)
        this.orgs = await this.gitServer.getOrg(this.user.login)
        if (!this.orgs) {
            throw new Error('组织信息获取失败！')
        }
        log.verbose('orgs', this.orgs)
        log.success(this.gitServer.type + ' 用户和组织信息获取成功')
    }

    createGitServer(gitServer) {
        if (gitServer === GITHUB) {
            return new Github()
        } else if (gitServer === GITEE) {
            return new Gitee()
        }
        return null
    }

    createPath(file) {
        const rootDir = path.resolve(this.homePath, GIT_ROOT_DIR)
        const filePath = path.resolve(rootDir, file)
        fse.ensureDirSync(rootDir)
        return filePath
    }

    init() {
        console.log('init')
    }
}

module.exports = Git;
