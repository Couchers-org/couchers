"use strict";
/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.account
 * @enhanceable
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck
var grpc = {};
grpc.web = require('grpc-web');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var google_protobuf_wrappers_pb = require('google-protobuf/google/protobuf/wrappers_pb.js');
var annotations_pb = require('./annotations_pb.js');
var auth_pb = require('./auth_pb.js');
var proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.account = require('./account_pb.js');
/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.account.AccountClient =
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
proto.org.couchers.api.account.AccountPromiseClient =
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
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.api.account.GetAccountInfoRes>}
 */
var methodDescriptor_Account_GetAccountInfo = new grpc.web.MethodDescriptor('/org.couchers.api.account.Account/GetAccountInfo', grpc.web.MethodType.UNARY, google_protobuf_empty_pb.Empty, proto.org.couchers.api.account.GetAccountInfoRes, 
/**
 * @param {!proto.google.protobuf.Empty} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.account.GetAccountInfoRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.api.account.GetAccountInfoRes>}
 */
var methodInfo_Account_GetAccountInfo = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.account.GetAccountInfoRes, 
/**
 * @param {!proto.google.protobuf.Empty} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.account.GetAccountInfoRes.deserializeBinary);
/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.account.GetAccountInfoRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.account.GetAccountInfoRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.account.AccountClient.prototype.getAccountInfo =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.account.Account/GetAccountInfo', request, metadata || {}, methodDescriptor_Account_GetAccountInfo, callback);
    };
/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.account.GetAccountInfoRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.account.AccountPromiseClient.prototype.getAccountInfo =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.account.Account/GetAccountInfo', request, metadata || {}, methodDescriptor_Account_GetAccountInfo);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.account.ChangePasswordReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_Account_ChangePassword = new grpc.web.MethodDescriptor('/org.couchers.api.account.Account/ChangePassword', grpc.web.MethodType.UNARY, proto.org.couchers.api.account.ChangePasswordReq, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.account.ChangePasswordReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.account.ChangePasswordReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_Account_ChangePassword = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.account.ChangePasswordReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.account.ChangePasswordReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.account.AccountClient.prototype.changePassword =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.account.Account/ChangePassword', request, metadata || {}, methodDescriptor_Account_ChangePassword, callback);
    };
/**
 * @param {!proto.org.couchers.api.account.ChangePasswordReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.account.AccountPromiseClient.prototype.changePassword =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.account.Account/ChangePassword', request, metadata || {}, methodDescriptor_Account_ChangePassword);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.account.ChangeEmailReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_Account_ChangeEmail = new grpc.web.MethodDescriptor('/org.couchers.api.account.Account/ChangeEmail', grpc.web.MethodType.UNARY, proto.org.couchers.api.account.ChangeEmailReq, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.account.ChangeEmailReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.account.ChangeEmailReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_Account_ChangeEmail = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.account.ChangeEmailReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.account.ChangeEmailReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.account.AccountClient.prototype.changeEmail =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.account.Account/ChangeEmail', request, metadata || {}, methodDescriptor_Account_ChangeEmail, callback);
    };
/**
 * @param {!proto.org.couchers.api.account.ChangeEmailReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.account.AccountPromiseClient.prototype.changeEmail =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.account.Account/ChangeEmail', request, metadata || {}, methodDescriptor_Account_ChangeEmail);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.api.account.GetContributorFormInfoRes>}
 */
var methodDescriptor_Account_GetContributorFormInfo = new grpc.web.MethodDescriptor('/org.couchers.api.account.Account/GetContributorFormInfo', grpc.web.MethodType.UNARY, google_protobuf_empty_pb.Empty, proto.org.couchers.api.account.GetContributorFormInfoRes, 
/**
 * @param {!proto.google.protobuf.Empty} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.account.GetContributorFormInfoRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.api.account.GetContributorFormInfoRes>}
 */
var methodInfo_Account_GetContributorFormInfo = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.account.GetContributorFormInfoRes, 
/**
 * @param {!proto.google.protobuf.Empty} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.account.GetContributorFormInfoRes.deserializeBinary);
/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.account.GetContributorFormInfoRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.account.GetContributorFormInfoRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.account.AccountClient.prototype.getContributorFormInfo =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.account.Account/GetContributorFormInfo', request, metadata || {}, methodDescriptor_Account_GetContributorFormInfo, callback);
    };
/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.account.GetContributorFormInfoRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.account.AccountPromiseClient.prototype.getContributorFormInfo =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.account.Account/GetContributorFormInfo', request, metadata || {}, methodDescriptor_Account_GetContributorFormInfo);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.account.FillContributorFormReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_Account_FillContributorForm = new grpc.web.MethodDescriptor('/org.couchers.api.account.Account/FillContributorForm', grpc.web.MethodType.UNARY, proto.org.couchers.api.account.FillContributorFormReq, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.account.FillContributorFormReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.account.FillContributorFormReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_Account_FillContributorForm = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.account.FillContributorFormReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.account.FillContributorFormReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.account.AccountClient.prototype.fillContributorForm =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.account.Account/FillContributorForm', request, metadata || {}, methodDescriptor_Account_FillContributorForm, callback);
    };
/**
 * @param {!proto.org.couchers.api.account.FillContributorFormReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.account.AccountPromiseClient.prototype.fillContributorForm =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.account.Account/FillContributorForm', request, metadata || {}, methodDescriptor_Account_FillContributorForm);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.account.ChangePhoneReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_Account_ChangePhone = new grpc.web.MethodDescriptor('/org.couchers.api.account.Account/ChangePhone', grpc.web.MethodType.UNARY, proto.org.couchers.api.account.ChangePhoneReq, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.account.ChangePhoneReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.account.ChangePhoneReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_Account_ChangePhone = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.account.ChangePhoneReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.account.ChangePhoneReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.account.AccountClient.prototype.changePhone =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.account.Account/ChangePhone', request, metadata || {}, methodDescriptor_Account_ChangePhone, callback);
    };
/**
 * @param {!proto.org.couchers.api.account.ChangePhoneReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.account.AccountPromiseClient.prototype.changePhone =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.account.Account/ChangePhone', request, metadata || {}, methodDescriptor_Account_ChangePhone);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.account.VerifyPhoneReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_Account_VerifyPhone = new grpc.web.MethodDescriptor('/org.couchers.api.account.Account/VerifyPhone', grpc.web.MethodType.UNARY, proto.org.couchers.api.account.VerifyPhoneReq, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.account.VerifyPhoneReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.account.VerifyPhoneReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_Account_VerifyPhone = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.account.VerifyPhoneReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.account.VerifyPhoneReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.account.AccountClient.prototype.verifyPhone =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.account.Account/VerifyPhone', request, metadata || {}, methodDescriptor_Account_VerifyPhone, callback);
    };
/**
 * @param {!proto.org.couchers.api.account.VerifyPhoneReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.account.AccountPromiseClient.prototype.verifyPhone =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.account.Account/VerifyPhone', request, metadata || {}, methodDescriptor_Account_VerifyPhone);
    };
module.exports = proto.org.couchers.api.account;
//# sourceMappingURL=account_grpc_web_pb.js.map