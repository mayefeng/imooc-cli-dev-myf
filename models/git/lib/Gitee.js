const GitServer = require('./gitServer')
const GiteeRequest = require('./GiteeRequest')

class Gitee extends GitServer {
    constructor() {
        super('gitee')
    }

    setToken(token) {
        super.setToken(token)
        this.request = new GiteeRequest(token)

    }

    getUser() {
        return this.request.get('/user')
        .then(response => {
            return this.handleResponse(response);
        });
    }

    getOrg(username) {
        return this.request.get(`/users/${username}/orgs`, {
            page: 1,
            per_page: 100
        })
        .then(response => {
            return this.handleResponse(response);
        });
    }

    getRepo(login, name) {
        return this.request
            .get(`/repos/${login}/${name}`)
            .then(response => {
                return this.handleResponse(response);
            });
    }

    createRepo(name) {
        return this.request.post('/user/repos', {
            name,
        })
        .then(response => {
            return this.handleResponse(response);
        });
    }

    createOrgRepo(name, login) {
        return this.request.post(`/orgs/${login}/repos`, {
            name,
        })
    }

    getTokenUrl() {
        return 'https://gitee.com/personal_access_tokens'
    }
    
    getTokenHelpUrl() {
        return 'https://gitee.com/help/articles/4191'
    }
}

module.exports = Gitee