/**
 * @fileoverview gRPC-Web generated client stub for auth
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');

const proto = {};
proto.auth = require('./auth_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.auth.AuthClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'binary';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.auth.AuthPromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'binary';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.auth.SignupReq,
 *   !proto.auth.SignupRes>}
 */
const methodDescriptor_Auth_Signup = new grpc.web.MethodDescriptor(
  '/auth.Auth/Signup',
  grpc.web.MethodType.UNARY,
  proto.auth.SignupReq,
  proto.auth.SignupRes,
  /**
   * @param {!proto.auth.SignupReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.SignupRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.auth.SignupReq,
 *   !proto.auth.SignupRes>}
 */
const methodInfo_Auth_Signup = new grpc.web.AbstractClientBase.MethodInfo(
  proto.auth.SignupRes,
  /**
   * @param {!proto.auth.SignupReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.SignupRes.deserializeBinary
);


/**
 * @param {!proto.auth.SignupReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.auth.SignupRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.auth.SignupRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.auth.AuthClient.prototype.signup =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/auth.Auth/Signup',
      request,
      metadata || {},
      methodDescriptor_Auth_Signup,
      callback);
};


/**
 * @param {!proto.auth.SignupReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.auth.SignupRes>}
 *     A native promise that resolves to the response
 */
proto.auth.AuthPromiseClient.prototype.signup =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/auth.Auth/Signup',
      request,
      metadata || {},
      methodDescriptor_Auth_Signup);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.auth.UsernameValidReq,
 *   !proto.auth.UsernameValidRes>}
 */
const methodDescriptor_Auth_UsernameValid = new grpc.web.MethodDescriptor(
  '/auth.Auth/UsernameValid',
  grpc.web.MethodType.UNARY,
  proto.auth.UsernameValidReq,
  proto.auth.UsernameValidRes,
  /**
   * @param {!proto.auth.UsernameValidReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.UsernameValidRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.auth.UsernameValidReq,
 *   !proto.auth.UsernameValidRes>}
 */
const methodInfo_Auth_UsernameValid = new grpc.web.AbstractClientBase.MethodInfo(
  proto.auth.UsernameValidRes,
  /**
   * @param {!proto.auth.UsernameValidReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.UsernameValidRes.deserializeBinary
);


/**
 * @param {!proto.auth.UsernameValidReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.auth.UsernameValidRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.auth.UsernameValidRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.auth.AuthClient.prototype.usernameValid =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/auth.Auth/UsernameValid',
      request,
      metadata || {},
      methodDescriptor_Auth_UsernameValid,
      callback);
};


/**
 * @param {!proto.auth.UsernameValidReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.auth.UsernameValidRes>}
 *     A native promise that resolves to the response
 */
proto.auth.AuthPromiseClient.prototype.usernameValid =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/auth.Auth/UsernameValid',
      request,
      metadata || {},
      methodDescriptor_Auth_UsernameValid);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.auth.SignupTokenInfoReq,
 *   !proto.auth.SignupTokenInfoRes>}
 */
const methodDescriptor_Auth_SignupTokenInfo = new grpc.web.MethodDescriptor(
  '/auth.Auth/SignupTokenInfo',
  grpc.web.MethodType.UNARY,
  proto.auth.SignupTokenInfoReq,
  proto.auth.SignupTokenInfoRes,
  /**
   * @param {!proto.auth.SignupTokenInfoReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.SignupTokenInfoRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.auth.SignupTokenInfoReq,
 *   !proto.auth.SignupTokenInfoRes>}
 */
const methodInfo_Auth_SignupTokenInfo = new grpc.web.AbstractClientBase.MethodInfo(
  proto.auth.SignupTokenInfoRes,
  /**
   * @param {!proto.auth.SignupTokenInfoReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.SignupTokenInfoRes.deserializeBinary
);


/**
 * @param {!proto.auth.SignupTokenInfoReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.auth.SignupTokenInfoRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.auth.SignupTokenInfoRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.auth.AuthClient.prototype.signupTokenInfo =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/auth.Auth/SignupTokenInfo',
      request,
      metadata || {},
      methodDescriptor_Auth_SignupTokenInfo,
      callback);
};


/**
 * @param {!proto.auth.SignupTokenInfoReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.auth.SignupTokenInfoRes>}
 *     A native promise that resolves to the response
 */
proto.auth.AuthPromiseClient.prototype.signupTokenInfo =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/auth.Auth/SignupTokenInfo',
      request,
      metadata || {},
      methodDescriptor_Auth_SignupTokenInfo);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.auth.CompleteSignupReq,
 *   !proto.auth.AuthRes>}
 */
const methodDescriptor_Auth_CompleteSignup = new grpc.web.MethodDescriptor(
  '/auth.Auth/CompleteSignup',
  grpc.web.MethodType.UNARY,
  proto.auth.CompleteSignupReq,
  proto.auth.AuthRes,
  /**
   * @param {!proto.auth.CompleteSignupReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.AuthRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.auth.CompleteSignupReq,
 *   !proto.auth.AuthRes>}
 */
const methodInfo_Auth_CompleteSignup = new grpc.web.AbstractClientBase.MethodInfo(
  proto.auth.AuthRes,
  /**
   * @param {!proto.auth.CompleteSignupReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.AuthRes.deserializeBinary
);


/**
 * @param {!proto.auth.CompleteSignupReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.auth.AuthRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.auth.AuthRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.auth.AuthClient.prototype.completeSignup =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/auth.Auth/CompleteSignup',
      request,
      metadata || {},
      methodDescriptor_Auth_CompleteSignup,
      callback);
};


/**
 * @param {!proto.auth.CompleteSignupReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.auth.AuthRes>}
 *     A native promise that resolves to the response
 */
proto.auth.AuthPromiseClient.prototype.completeSignup =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/auth.Auth/CompleteSignup',
      request,
      metadata || {},
      methodDescriptor_Auth_CompleteSignup);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.auth.LoginReq,
 *   !proto.auth.LoginRes>}
 */
const methodDescriptor_Auth_Login = new grpc.web.MethodDescriptor(
  '/auth.Auth/Login',
  grpc.web.MethodType.UNARY,
  proto.auth.LoginReq,
  proto.auth.LoginRes,
  /**
   * @param {!proto.auth.LoginReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.LoginRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.auth.LoginReq,
 *   !proto.auth.LoginRes>}
 */
const methodInfo_Auth_Login = new grpc.web.AbstractClientBase.MethodInfo(
  proto.auth.LoginRes,
  /**
   * @param {!proto.auth.LoginReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.LoginRes.deserializeBinary
);


/**
 * @param {!proto.auth.LoginReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.auth.LoginRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.auth.LoginRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.auth.AuthClient.prototype.login =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/auth.Auth/Login',
      request,
      metadata || {},
      methodDescriptor_Auth_Login,
      callback);
};


/**
 * @param {!proto.auth.LoginReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.auth.LoginRes>}
 *     A native promise that resolves to the response
 */
proto.auth.AuthPromiseClient.prototype.login =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/auth.Auth/Login',
      request,
      metadata || {},
      methodDescriptor_Auth_Login);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.auth.CompleteTokenLoginReq,
 *   !proto.auth.AuthRes>}
 */
const methodDescriptor_Auth_CompleteTokenLogin = new grpc.web.MethodDescriptor(
  '/auth.Auth/CompleteTokenLogin',
  grpc.web.MethodType.UNARY,
  proto.auth.CompleteTokenLoginReq,
  proto.auth.AuthRes,
  /**
   * @param {!proto.auth.CompleteTokenLoginReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.AuthRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.auth.CompleteTokenLoginReq,
 *   !proto.auth.AuthRes>}
 */
const methodInfo_Auth_CompleteTokenLogin = new grpc.web.AbstractClientBase.MethodInfo(
  proto.auth.AuthRes,
  /**
   * @param {!proto.auth.CompleteTokenLoginReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.AuthRes.deserializeBinary
);


/**
 * @param {!proto.auth.CompleteTokenLoginReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.auth.AuthRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.auth.AuthRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.auth.AuthClient.prototype.completeTokenLogin =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/auth.Auth/CompleteTokenLogin',
      request,
      metadata || {},
      methodDescriptor_Auth_CompleteTokenLogin,
      callback);
};


/**
 * @param {!proto.auth.CompleteTokenLoginReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.auth.AuthRes>}
 *     A native promise that resolves to the response
 */
proto.auth.AuthPromiseClient.prototype.completeTokenLogin =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/auth.Auth/CompleteTokenLogin',
      request,
      metadata || {},
      methodDescriptor_Auth_CompleteTokenLogin);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.auth.AuthReq,
 *   !proto.auth.AuthRes>}
 */
const methodDescriptor_Auth_Authenticate = new grpc.web.MethodDescriptor(
  '/auth.Auth/Authenticate',
  grpc.web.MethodType.UNARY,
  proto.auth.AuthReq,
  proto.auth.AuthRes,
  /**
   * @param {!proto.auth.AuthReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.AuthRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.auth.AuthReq,
 *   !proto.auth.AuthRes>}
 */
const methodInfo_Auth_Authenticate = new grpc.web.AbstractClientBase.MethodInfo(
  proto.auth.AuthRes,
  /**
   * @param {!proto.auth.AuthReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.AuthRes.deserializeBinary
);


/**
 * @param {!proto.auth.AuthReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.auth.AuthRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.auth.AuthRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.auth.AuthClient.prototype.authenticate =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/auth.Auth/Authenticate',
      request,
      metadata || {},
      methodDescriptor_Auth_Authenticate,
      callback);
};


/**
 * @param {!proto.auth.AuthReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.auth.AuthRes>}
 *     A native promise that resolves to the response
 */
proto.auth.AuthPromiseClient.prototype.authenticate =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/auth.Auth/Authenticate',
      request,
      metadata || {},
      methodDescriptor_Auth_Authenticate);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.auth.DeAuthReq,
 *   !proto.auth.DeAuthRes>}
 */
const methodDescriptor_Auth_Deauthenticate = new grpc.web.MethodDescriptor(
  '/auth.Auth/Deauthenticate',
  grpc.web.MethodType.UNARY,
  proto.auth.DeAuthReq,
  proto.auth.DeAuthRes,
  /**
   * @param {!proto.auth.DeAuthReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.DeAuthRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.auth.DeAuthReq,
 *   !proto.auth.DeAuthRes>}
 */
const methodInfo_Auth_Deauthenticate = new grpc.web.AbstractClientBase.MethodInfo(
  proto.auth.DeAuthRes,
  /**
   * @param {!proto.auth.DeAuthReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.auth.DeAuthRes.deserializeBinary
);


/**
 * @param {!proto.auth.DeAuthReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.auth.DeAuthRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.auth.DeAuthRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.auth.AuthClient.prototype.deauthenticate =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/auth.Auth/Deauthenticate',
      request,
      metadata || {},
      methodDescriptor_Auth_Deauthenticate,
      callback);
};


/**
 * @param {!proto.auth.DeAuthReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.auth.DeAuthRes>}
 *     A native promise that resolves to the response
 */
proto.auth.AuthPromiseClient.prototype.deauthenticate =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/auth.Auth/Deauthenticate',
      request,
      metadata || {},
      methodDescriptor_Auth_Deauthenticate);
};


module.exports = proto.auth;

