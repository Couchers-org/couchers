"use strict";
/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.discussions
 * @enhanceable
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck
var grpc = {};
grpc.web = require('grpc-web');
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');
var annotations_pb = require('./annotations_pb.js');
var threads_pb = require('./threads_pb.js');
var proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.discussions = require('./discussions_pb.js');
/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.discussions.DiscussionsClient =
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
proto.org.couchers.api.discussions.DiscussionsPromiseClient =
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
 *   !proto.org.couchers.api.discussions.CreateDiscussionReq,
 *   !proto.org.couchers.api.discussions.Discussion>}
 */
var methodDescriptor_Discussions_CreateDiscussion = new grpc.web.MethodDescriptor('/org.couchers.api.discussions.Discussions/CreateDiscussion', grpc.web.MethodType.UNARY, proto.org.couchers.api.discussions.CreateDiscussionReq, proto.org.couchers.api.discussions.Discussion, 
/**
 * @param {!proto.org.couchers.api.discussions.CreateDiscussionReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.discussions.Discussion.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.discussions.CreateDiscussionReq,
 *   !proto.org.couchers.api.discussions.Discussion>}
 */
var methodInfo_Discussions_CreateDiscussion = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.discussions.Discussion, 
/**
 * @param {!proto.org.couchers.api.discussions.CreateDiscussionReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.discussions.Discussion.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.discussions.CreateDiscussionReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.discussions.Discussion)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.discussions.Discussion>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.discussions.DiscussionsClient.prototype.createDiscussion =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.discussions.Discussions/CreateDiscussion', request, metadata || {}, methodDescriptor_Discussions_CreateDiscussion, callback);
    };
/**
 * @param {!proto.org.couchers.api.discussions.CreateDiscussionReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.discussions.Discussion>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.discussions.DiscussionsPromiseClient.prototype.createDiscussion =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.discussions.Discussions/CreateDiscussion', request, metadata || {}, methodDescriptor_Discussions_CreateDiscussion);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.discussions.GetDiscussionReq,
 *   !proto.org.couchers.api.discussions.Discussion>}
 */
var methodDescriptor_Discussions_GetDiscussion = new grpc.web.MethodDescriptor('/org.couchers.api.discussions.Discussions/GetDiscussion', grpc.web.MethodType.UNARY, proto.org.couchers.api.discussions.GetDiscussionReq, proto.org.couchers.api.discussions.Discussion, 
/**
 * @param {!proto.org.couchers.api.discussions.GetDiscussionReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.discussions.Discussion.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.discussions.GetDiscussionReq,
 *   !proto.org.couchers.api.discussions.Discussion>}
 */
var methodInfo_Discussions_GetDiscussion = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.discussions.Discussion, 
/**
 * @param {!proto.org.couchers.api.discussions.GetDiscussionReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.discussions.Discussion.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.discussions.GetDiscussionReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.discussions.Discussion)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.discussions.Discussion>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.discussions.DiscussionsClient.prototype.getDiscussion =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.discussions.Discussions/GetDiscussion', request, metadata || {}, methodDescriptor_Discussions_GetDiscussion, callback);
    };
/**
 * @param {!proto.org.couchers.api.discussions.GetDiscussionReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.discussions.Discussion>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.discussions.DiscussionsPromiseClient.prototype.getDiscussion =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.discussions.Discussions/GetDiscussion', request, metadata || {}, methodDescriptor_Discussions_GetDiscussion);
    };
module.exports = proto.org.couchers.api.discussions;
//# sourceMappingURL=discussions_grpc_web_pb.js.map