import Store from './store'

export class AuthInterceptor {
  intercept(request: any, invoker: (request: any) => any) {
    request.getMetadata()['authorization'] = 'Bearer ' + Store.state.authToken
    return invoker(request)
  }
}

export default new AuthInterceptor()
