import { AuthClient } from './pb/AuthServiceClientPb'
import { AuthRequest, DeauthRequest } from './pb/auth_pb'

import Store, { AuthenticationState } from './store'

import Router from './router'

const client = new AuthClient("http://127.0.0.1:8888")

function authenticate(username: string, password: string, callback: (error: string|null, message: string|null) => void) {
  const req = new AuthRequest()
  req.setUsername(username)
  req.setPassword(password)
  client.authenticate(req, null, (err, res) => {
    if (!err && res) {
      Store.commit('auth', {
        authState: AuthenticationState.Authenticated,
        authToken: res.getToken()
      })
      Router.push('/')
      callback(null, 'Success.')
    } else {
      Store.commit('deauth')
      Router.push({ name: 'Login' })
      callback('Error.', null)
    }
  })
}

function deauth() {
  const req = new DeauthRequest()
  req.setToken(Store.state.authToken!)
  client.deauthenticate(req, null, (err, res) => {
    if (!err && res && res.getOk()) {
      Store.commit('deauth')
      Router.push({ name: 'Login' })
    } else {
      Store.commit('error', 'Could not log out!')
    }
  })
}

class AuthInterceptor {
  intercept(request: any, invoker: (request: any) => any) {
    request.getMetadata()["authorization"] = "Bearer " + Store.state.authToken
    return invoker(request);
  }
}

const auth = {
  client,
  authenticate,
  deauth,
  interceptor: new AuthInterceptor()
}

export default auth