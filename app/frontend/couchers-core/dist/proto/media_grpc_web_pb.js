"use strict";
/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.media
 * @enhanceable
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck
var grpc = {};
grpc.web = require('grpc-web');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');
var proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.media = require('./media_pb.js');
/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.media.MediaClient =
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
proto.org.couchers.media.MediaPromiseClient =
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
 *   !proto.org.couchers.media.UploadConfirmationReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_Media_UploadConfirmation = new grpc.web.MethodDescriptor('/org.couchers.media.Media/UploadConfirmation', grpc.web.MethodType.UNARY, proto.org.couchers.media.UploadConfirmationReq, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.media.UploadConfirmationReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.media.UploadConfirmationReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_Media_UploadConfirmation = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.media.UploadConfirmationReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.org.couchers.media.UploadConfirmationReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.media.MediaClient.prototype.uploadConfirmation =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.media.Media/UploadConfirmation', request, metadata || {}, methodDescriptor_Media_UploadConfirmation, callback);
    };
/**
 * @param {!proto.org.couchers.media.UploadConfirmationReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.media.MediaPromiseClient.prototype.uploadConfirmation =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.media.Media/UploadConfirmation', request, metadata || {}, methodDescriptor_Media_UploadConfirmation);
    };
module.exports = proto.org.couchers.media;
//# sourceMappingURL=media_grpc_web_pb.js.map