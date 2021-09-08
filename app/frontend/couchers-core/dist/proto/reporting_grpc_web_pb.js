"use strict";
/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.reporting
 * @enhanceable
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck
var grpc = {};
grpc.web = require('grpc-web');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var annotations_pb = require('./annotations_pb.js');
var proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.reporting = require('./reporting_pb.js');
/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.reporting.ReportingClient =
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
proto.org.couchers.api.reporting.ReportingPromiseClient =
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
 *   !proto.org.couchers.api.reporting.ReportReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_Reporting_Report = new grpc.web.MethodDescriptor('/org.couchers.api.reporting.Reporting/Report', grpc.web.MethodType.UNARY, proto.org.couchers.api.reporting.ReportReq, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.reporting.ReportReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.reporting.ReportReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_Reporting_Report = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.reporting.ReportReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.reporting.ReportReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.reporting.ReportingClient.prototype.report =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.reporting.Reporting/Report', request, metadata || {}, methodDescriptor_Reporting_Report, callback);
    };
/**
 * @param {!proto.org.couchers.api.reporting.ReportReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.reporting.ReportingPromiseClient.prototype.report =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.reporting.Reporting/Report', request, metadata || {}, methodDescriptor_Reporting_Report);
    };
module.exports = proto.org.couchers.api.reporting;
//# sourceMappingURL=reporting_grpc_web_pb.js.map