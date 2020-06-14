import { AuthClient } from './pb/AuthServiceClientPb'
import { AuthReq, DeAuthReq, LoginReq, SignupReq, LoginRes } from './pb/auth_pb'

import Store, { AuthenticationState } from './store'

import * as grpcWeb from 'grpc-web'

import Router from './router'

const client = new AuthClient("http://127.0.0.1:8888")

function authenticate(username: string, password: string, callback: (error: string|null, message: string|null) => void) {
  const req = new AuthReq()
  req.setUsername(username)
  req.setPassword(password)
  client.authenticate(req, null).then(res => {
    Store.commit('auth', {
      authState: AuthenticationState.Authenticated,
      authToken: res.getToken()
    })
    Router.push('/')
    callback(null, 'Success.')
  }).catch(err => {
    Store.commit('deauth')
    Router.push({ name: 'Login' })
    if (err.code == grpcWeb.StatusCode.UNAUTHENTICATED) {
      callback('Invalid username or password.', null)
    } else {
      callback('Unknown error.', null)
    }
  })
}

function deauth() {
  const req = new DeAuthReq()
  req.setToken(Store.state.authToken!)
  client.deauthenticate(req, null).then(res => {
    Store.commit('deauth')
    Router.push({ name: 'Login' })
  }).catch(err => {
    console.error(err)
    Store.commit('error', 'Could not log out!')
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
