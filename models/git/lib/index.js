'use strict';

const fs = require('fs')
const path = require('path')
const SimpleGit = require('simple-git')
const fse = require('fs-extra')
const userHome = require('user-home')
const inquirer = require('inquirer')
const terminalLink = require('terminal-link')
const semver = require('semver')
const log = require('@imooc-cli-dev-myf/log')
const { readFile, writeFile, spinnerStart } = require('@imooc-cli-dev-myf/utils');
const Github = require('./Github');
const Gitee = require('./Gitee');

const DEFAULT_CLI_HOME = '.imooc-cli-dev-myf'
const GIT_ROOT_DIR = '.git'
const GIT_SERVER_FILE = '.git_server'
const GIT_TOKEN_FILE = '.git_token'
const GIT_OWN_FILE = '.git_own'
const GIT_LOGIN_FILE = '.git_login'
const GIT_IGNORE_FILE = '.gitignore'

const GITHUB = 'github'
const GITEE = 'gitee'
const GITLAB = 'gitlab'
const REPO_OWNER_USER = 'user'
const REPO_OWNER_ORG = 'org'
const VERSION_RELEASE = 'release'
const VERSION_DEVELOP = 'dev'

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

const GIT_OWNER_TYPE = [
    {
        name: '个人',
        value: REPO_OWNER_USER,
    },
    {
        name: '组织',
        value: REPO_OWNER_ORG
    },
]

const GIT_OWNER_TYPE_ONLY = [
    {
        name: '个人',
        value: REPO_OWNER_USER,
    },
]

class Git {
    constructor({name, version, dir}, { 
        refreshServer = false,
        refreshToken = false,
        refreshOwner = false
    }) {
        // 项目名称
        this.name = name
        // 项目版本
        this.version = version
        // 源码目录
        this.dir = dir
        // SimpleGit实例
        this.git = SimpleGit(dir)
        // GitServer实例
        this.gitServer = null
        // 本地缓存目录
        this.homePath = null
        // 用户信息
        this.user = null
        // 用户所属组织列表
        this.orgs = null
        // 远程仓库类型
        this.owner = null
        // 远程仓库登录名
        this.login = null
        // 远程仓库信息
        this.repo = null
        // 是否强制刷新远程仓库类型
        this.refreshServer = refreshServer
        // 是否强制刷新远程仓库token
        this.refreshToken = refreshToken
        // 是否强制刷新远程仓库类型
        this.refreshOwner = refreshOwner
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
        // 确认远程仓库类型
        await this.checkGitOwner()
        // 检查并创建远程仓库
        await this.checkRepo()
        // 检查并创建.gitigonre文件
        this.checkGitIgnore()
        // 完成本地仓库初始化
        await this.init()
    }

    async init() {
        if (await this.getRemote()) {
            return
        }
        await this.initAndAddRemote()
        await this.initCommit()
    }

    async commit() {
        // 1.生成开发分支
        await this.getCorrectVersion()
        // 2.在开发分支上提交diamante
        // 3.合并远程开发分支
        // 4.推送开发分支
    }

    async getCorrectVersion() {
        // 1.获取远程发布分支
        // 规范 release/x.y.z, dev/x.y.z
        // 版本号递增规范：major/minor/patch
        log.info('获取代码分支')
        const remoteBranchList = await this.getRemoteBranchList(VERSION_RELEASE)
        let releaseVersion = null
        if (remoteBranchList && remoteBranchList.length > 0) {
            releaseVersion = remoteBranchList[0]
        }
        log.verbose('线上最新版本号', releaseVersion)

    }

    async getRemoteBranchList(type) {
        const remoteList = await this.git.listRemote(['--refs'])
        let reg
        if (type === VERSION_RELEASE) {
            reg = /.+?refs\/tags\/release\/(\d+\.\d+\.\d+)/g
        } else {

        }
        return remoteList.split('\n').map(remote => {
            const match = reg.exec(remote)
            reg.lastIndex = 0
            if (match && semver.valid(match[1])) {
                return match[1]
            }
        }).filter(_ => _).sort((a, b) => {
            if (semver.lte(b, a)) {
                if (a === b) return 0
                return -1
            }
            return 1
        })
    }

    async initCommit() {
        await this.checkConflicted()
        await this.checkNotCommitted()
        if (await this.checkRemoteMaster()) {
            await this.pullRemoteRepo('master', {
                '--allow-unrelated-histories': null
            })
        } else {
            await this.pushRemoteRepo('master')
        }
    }

    async pullRemoteRepo(branchName, options) {
        log.info(`同步远程${branchName}分支代码`)
        await this.git.pull('origin', branchName, options)
            .catch(err => {
                log.error(err)
            })
    }

    async pushRemoteRepo(branchName) {
        log.info(`推送代码至${branchName}分支`)
        await this.git.push('origin', branchName)
        log.success('推送代码成功')
    }

    async checkRemoteMaster() {
        return (await this.git.listRemote(['--refs'])).indexOf('refs/heads/master') >= 0
    }

    async checkNotCommitted() {
        const status =  await this.git.status()
        if (status.not_added.length > 0 || 
            status.created.length > 0 ||
            status.deleted.length > 0 ||
            status.modified.length > 0 ||
            status.renamed.length > 0
        ) {
            log.verbose('status', status)
            await this.git.add(status.not_added)
            await this.git.add(status.created)
            await this.git.add(status.deleted)
            await this.git.add(status.modified)
            await this.git.add(status.renamed)
            let message
            while (!message) {
                message = (await inquirer.prompt({
                    type: 'text',
                    name: 'message',
                    message: '请输入commit信息：'
                })).message
            }
            await this.git.commit(message)
            log.success('本次commit提交成功')
        }
    }

    async checkConflicted() {
        log.info('代码冲突检查')
        const status = await this.git.status()
        if (status.conflicted.length > 0) {
            throw new Error('当前代码存在冲突，请手动处理后再试！')
        }
        log.success('代码冲突检查通过')
    }

    async getRemote() {
        const gitPath = path.resolve(this.dir, GIT_ROOT_DIR)
        this.remote = this.gitServer.getRemote(this.login, this.name)
        if (fs.existsSync(gitPath)) {
            log.success('git已完成初始化')
            return true
        }
    }

    async initAndAddRemote() {
        log.info('执行git初始化')
        await this.git.init(this.dir)
        log.info('添加git remote')
        const remotes = await this.git.getRemotes()
        log.verbose('git remotes', remotes)
        if (!remotes.find(item => item.name === 'origin')) {
            await this.git.addRemote('origin', this.remote)
        }
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

    async checkGitOwner() {
        const ownerPath = this.createPath(GIT_OWN_FILE)
        const loginPath = this.createPath(GIT_LOGIN_FILE)
        let owner = readFile(ownerPath)
        let login = readFile(loginPath)
        if (!owner || !login || this.refreshOwner) {
            owner = (await inquirer.prompt({
                type: 'list',
                name: 'owner',
                message: '请选择您远程仓库类型',
                default: REPO_OWNER_USER,
                choices: this.orgs.length > 0 ? GIT_OWNER_TYPE : GIT_OWNER_TYPE_ONLY
            })).owner
            if (owner === REPO_OWNER_USER) {
                login = this.user.login
            } else {
                login = (await inquirer.prompt({
                    type: 'list',
                    name: 'login',
                    message: '请选择',
                    choices: this.orgs.map(org => ({
                        name: org.login,
                        value: org.login,
                    }))
                })).login
            }
            writeFile(ownerPath, owner)
            log.success('owner写入成功', `${owner} -> ${ownerPath}`)
            writeFile(loginPath, login)
            log.success('login写入成功', `${login} -> ${loginPath}`)
        } else {
            log.success('owner获取成功', owner)
            log.success('login获取成功', login)
        }
        this.owner = owner
        this.login = login
    }

    async checkRepo() {
        let repo = await this.gitServer.getRepo(this.login, this.name)
        if (!repo) {
            let spinner = spinnerStart('开始创建远程仓库...')
            try {
                if (this.owner === REPO_OWNER_USER) {
                    repo = await this.gitServer.createRepo(this.name)
                } else {
                    repo = await this.gitServer.createOrgRepo(this.name, this.login)
                }
            } catch (e) {
                log.error(e)
            } finally {
                spinner.stop(true)
            }
            if (repo) {
                log.success('远程仓库创建成功');
            } else {
                throw new Error('远程仓库创建失败');
            }
        } else {
            log.success('远程仓库信息获取成功');
        }
        log.verbose('repo', repo);
        this.repo = repo;
    }

    checkGitIgnore() {
        const gitIgnore = path.resolve(this.dir, GIT_IGNORE_FILE)
        if (!fs.existsSync(gitIgnore)) {
            writeFile(gitIgnore, `.DS_Store
node_modules
/dist


# local env files
.env.local
.env.*.local

# Log files
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`)
            log.success(`自动写入${GIT_IGNORE_FILE}文件成功`)
        }
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
}

module.exports = Git;
