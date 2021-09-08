"use strict";
/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.auth
 * @enhanceable
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck
var grpc = {};
grpc.web = require('grpc-web');
var google_api_annotations_pb = require('./google/api/annotations_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var google_protobuf_wrappers_pb = require('google-protobuf/google/protobuf/wrappers_pb.js');
var annotations_pb = require('./annotations_pb.js');
var api_pb = require('./api_pb.js');
var proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.auth = require('./auth_pb.js');
/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.auth.AuthClient =
    function (hostname, credentials, options) {
        if (!options)
            options = {};
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
proto.org.couchers.auth.AuthPromiseClient =
    function (hostname, credentials, options) {
        if (!options)
            options = {};
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
 *   !proto.org.couchers.auth.SignupFlowReq,
 *   !proto.org.couchers.auth.SignupFlowRes>}
 */
var methodDescriptor_Auth_SignupFlow = new grpc.web.MethodDescriptor('/org.couchers.auth.Auth/SignupFlow', grpc.web.MethodType.UNARY, proto.org.couchers.auth.SignupFlowReq, proto.org.couchers.auth.SignupFlowRes, 
/**
 * @param {!proto.org.couchers.auth.SignupFlowReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.auth.SignupFlowRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.auth.SignupFlowReq,
 *   !proto.org.couchers.auth.SignupFlowRes>}
 */
var methodInfo_Auth_SignupFlow = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.auth.SignupFlowRes, 
/**
 * @param {!proto.org.couchers.auth.SignupFlowReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.auth.SignupFlowRes.deserializeBinary);
/**
 * @param {!proto.org.couchers.auth.SignupFlowReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.auth.SignupFlowRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.auth.SignupFlowRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.auth.AuthClient.prototype.signupFlow =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.auth.Auth/SignupFlow', request, metadata || {}, methodDescriptor_Auth_SignupFlow, callback);
    };
/**
 * @param {!proto.org.couchers.auth.SignupFlowReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.auth.SignupFlowRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.auth.AuthPromiseClient.prototype.signupFlow =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.auth.Auth/SignupFlow', request, metadata || {}, methodDescriptor_Auth_SignupFlow);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.auth.UsernameValidReq,
 *   !proto.org.couchers.auth.UsernameValidRes>}
 */
var methodDescriptor_Auth_UsernameValid = new grpc.web.MethodDescriptor('/org.couchers.auth.Auth/UsernameValid', grpc.web.MethodType.UNARY, proto.org.couchers.auth.UsernameValidReq, proto.org.couchers.auth.UsernameValidRes, 
/**
 * @param {!proto.org.couchers.auth.UsernameValidReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.auth.UsernameValidRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.auth.UsernameValidReq,
 *   !proto.org.couchers.auth.UsernameValidRes>}
 */
var methodInfo_Auth_UsernameValid = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.auth.UsernameValidRes, 
/**
 * @param {!proto.org.couchers.auth.UsernameValidReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.auth.UsernameValidRes.deserializeBinary);
/**
 * @param {!proto.org.couchers.auth.UsernameValidReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.auth.UsernameValidRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.auth.UsernameValidRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.auth.AuthClient.prototype.usernameValid =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.auth.Auth/UsernameValid', request, metadata || {}, methodDescriptor_Auth_UsernameValid, callback);
    };
/**
 * @param {!proto.org.couchers.auth.UsernameValidReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.auth.UsernameValidRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.auth.AuthPromiseClient.prototype.usernameValid =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.auth.Auth/UsernameValid', request, metadata || {}, methodDescriptor_Auth_UsernameValid);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.auth.LoginReq,
 *   !proto.org.couchers.auth.LoginRes>}
 */
var methodDescriptor_Auth_Login = new grpc.web.MethodDescriptor('/org.couchers.auth.Auth/Login', grpc.web.MethodType.UNARY, proto.org.couchers.auth.LoginReq, proto.org.couchers.auth.LoginRes, 
/**
 * @param {!proto.org.couchers.auth.LoginReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.auth.LoginRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.auth.LoginReq,
 *   !proto.org.couchers.auth.LoginRes>}
 */
var methodInfo_Auth_Login = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.auth.LoginRes, 
/**
 * @param {!proto.org.couchers.auth.LoginReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.auth.LoginRes.deserializeBinary);
/**
 * @param {!proto.org.couchers.auth.LoginReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.auth.LoginRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.auth.LoginRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.auth.AuthClient.prototype.login =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.auth.Auth/Login', request, metadata || {}, methodDescriptor_Auth_Login, callback);
    };
/**
 * @param {!proto.org.couchers.auth.LoginReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.auth.LoginRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.auth.AuthPromiseClient.prototype.login =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.auth.Auth/Login', request, metadata || {}, methodDescriptor_Auth_Login);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.auth.CompleteTokenLoginReq,
 *   !proto.org.couchers.auth.AuthRes>}
 */
var methodDescriptor_Auth_CompleteTokenLogin = new grpc.web.MethodDescriptor('/org.couchers.auth.Auth/CompleteTokenLogin', grpc.web.MethodType.UNARY, proto.org.couchers.auth.CompleteTokenLoginReq, proto.org.couchers.auth.AuthRes, 
/**
 * @param {!proto.org.couchers.auth.CompleteTokenLoginReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.auth.AuthRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.auth.CompleteTokenLoginReq,
 *   !proto.org.couchers.auth.AuthRes>}
 */
var methodInfo_Auth_CompleteTokenLogin = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.auth.AuthRes, 
/**
 * @param {!proto.org.couchers.auth.CompleteTokenLoginReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.auth.AuthRes.deserializeBinary);
/**
 * @param {!proto.org.couchers.auth.CompleteTokenLoginReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.auth.AuthRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.auth.AuthRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.auth.AuthClient.prototype.completeTokenLogin =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.auth.Auth/CompleteTokenLogin', request, metadata || {}, methodDescriptor_Auth_CompleteTokenLogin, callback);
    };
/**
 * @param {!proto.org.couchers.auth.CompleteTokenLoginReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.auth.AuthRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.auth.AuthPromiseClient.prototype.completeTokenLogin =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.auth.Auth/CompleteTokenLogin', request, metadata || {}, methodDescriptor_Auth_CompleteTokenLogin);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.auth.AuthReq,
 *   !proto.org.couchers.auth.AuthRes>}
 */
var methodDescriptor_Auth_Authenticate = new grpc.web.MethodDescriptor('/org.couchers.auth.Auth/Authenticate', grpc.web.MethodType.UNARY, proto.org.couchers.auth.AuthReq, proto.org.couchers.auth.AuthRes, 
/**
 * @param {!proto.org.couchers.auth.AuthReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.auth.AuthRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.auth.AuthReq,
 *   !proto.org.couchers.auth.AuthRes>}
 */
var methodInfo_Auth_Authenticate = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.auth.AuthRes, 
/**
 * @param {!proto.org.couchers.auth.AuthReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.auth.AuthRes.deserializeBinary);
/**
 * @param {!proto.org.couchers.auth.AuthReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.auth.AuthRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.auth.AuthRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.auth.AuthClient.prototype.authenticate =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.auth.Auth/Authenticate', request, metadata || {}, methodDescriptor_Auth_Authenticate, callback);
    };
/**
 * @param {!proto.org.couchers.auth.AuthReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.auth.AuthRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.auth.AuthPromiseClient.prototype.authenticate =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.auth.Auth/Authenticate', request, metadata || {}, methodDescriptor_Auth_Authenticate);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_Auth_Deauthenticate = new grpc.web.MethodDescriptor('/org.couchers.auth.Auth/Deauthenticate', grpc.web.MethodType.UNARY, google_protobuf_empty_pb.Empty, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.google.protobuf.Empty} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_Auth_Deauthenticate = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.google.protobuf.Empty} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.auth.AuthClient.prototype.deauthenticate =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.auth.Auth/Deauthenticate', request, metadata || {}, methodDescriptor_Auth_Deauthenticate, callback);
    };
/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.auth.AuthPromiseClient.prototype.deauthenticate =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.auth.Auth/Deauthenticate', request, metadata || {}, methodDescriptor_Auth_Deauthenticate);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.auth.ResetPasswordReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_Auth_ResetPassword = new grpc.web.MethodDescriptor('/org.couchers.auth.Auth/ResetPassword', grpc.web.MethodType.UNARY, proto.org.couchers.auth.ResetPasswordReq, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.auth.ResetPasswordReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.auth.ResetPasswordReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_Auth_ResetPassword = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.auth.ResetPasswordReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.org.couchers.auth.ResetPasswordReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.auth.AuthClient.prototype.resetPassword =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.auth.Auth/ResetPassword', request, metadata || {}, methodDescriptor_Auth_ResetPassword, callback);
    };
/**
 * @param {!proto.org.couchers.auth.ResetPasswordReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.auth.AuthPromiseClient.prototype.resetPassword =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.auth.Auth/ResetPassword', request, metadata || {}, methodDescriptor_Auth_ResetPassword);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.auth.CompletePasswordResetReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_Auth_CompletePasswordReset = new grpc.web.MethodDescriptor('/org.couchers.auth.Auth/CompletePasswordReset', grpc.web.MethodType.UNARY, proto.org.couchers.auth.CompletePasswordResetReq, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.auth.CompletePasswordResetReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.auth.CompletePasswordResetReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_Auth_CompletePasswordReset = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.auth.CompletePasswordResetReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.org.couchers.auth.CompletePasswordResetReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.auth.AuthClient.prototype.completePasswordReset =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.auth.Auth/CompletePasswordReset', request, metadata || {}, methodDescriptor_Auth_CompletePasswordReset, callback);
    };
/**
 * @param {!proto.org.couchers.auth.CompletePasswordResetReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.auth.AuthPromiseClient.prototype.completePasswordReset =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.auth.Auth/CompletePasswordReset', request, metadata || {}, methodDescriptor_Auth_CompletePasswordReset);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.auth.ConfirmChangeEmailReq,
 *   !proto.org.couchers.auth.ConfirmChangeEmailRes>}
 */
var methodDescriptor_Auth_ConfirmChangeEmail = new grpc.web.MethodDescriptor('/org.couchers.auth.Auth/ConfirmChangeEmail', grpc.web.MethodType.UNARY, proto.org.couchers.auth.ConfirmChangeEmailReq, proto.org.couchers.auth.ConfirmChangeEmailRes, 
/**
 * @param {!proto.org.couchers.auth.ConfirmChangeEmailReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.auth.ConfirmChangeEmailRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.auth.ConfirmChangeEmailReq,
 *   !proto.org.couchers.auth.ConfirmChangeEmailRes>}
 */
var methodInfo_Auth_ConfirmChangeEmail = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.auth.ConfirmChangeEmailRes, 
/**
 * @param {!proto.org.couchers.auth.ConfirmChangeEmailReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.auth.ConfirmChangeEmailRes.deserializeBinary);
/**
 * @param {!proto.org.couchers.auth.ConfirmChangeEmailReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.auth.ConfirmChangeEmailRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.auth.ConfirmChangeEmailRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.auth.AuthClient.prototype.confirmChangeEmail =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.auth.Auth/ConfirmChangeEmail', request, metadata || {}, methodDescriptor_Auth_ConfirmChangeEmail, callback);
    };
/**
 * @param {!proto.org.couchers.auth.ConfirmChangeEmailReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.auth.ConfirmChangeEmailRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.auth.AuthPromiseClient.prototype.confirmChangeEmail =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.auth.Auth/ConfirmChangeEmail', request, metadata || {}, methodDescriptor_Auth_ConfirmChangeEmail);
    };
module.exports = proto.org.couchers.auth;
//# sourceMappingURL=auth_grpc_web_pb.js.map