/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.references
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');


var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js')

var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js')
const proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.references = require('./references_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.references.ReferencesClient =
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
proto.org.couchers.api.references.ReferencesPromiseClient =
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
 *   !proto.org.couchers.api.references.ListReferencesReq,
 *   !proto.org.couchers.api.references.ListReferencesRes>}
 */
const methodDescriptor_References_ListReferences = new grpc.web.MethodDescriptor(
  '/org.couchers.api.references.References/ListReferences',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.references.ListReferencesReq,
  proto.org.couchers.api.references.ListReferencesRes,
  /**
   * @param {!proto.org.couchers.api.references.ListReferencesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.references.ListReferencesRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.references.ListReferencesReq,
 *   !proto.org.couchers.api.references.ListReferencesRes>}
 */
const methodInfo_References_ListReferences = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.references.ListReferencesRes,
  /**
   * @param {!proto.org.couchers.api.references.ListReferencesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.references.ListReferencesRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.references.ListReferencesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.references.ListReferencesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.references.ListReferencesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.references.ReferencesClient.prototype.listReferences =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.references.References/ListReferences',
      request,
      metadata || {},
      methodDescriptor_References_ListReferences,
      callback);
};


/**
 * @param {!proto.org.couchers.api.references.ListReferencesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.references.ListReferencesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.references.ReferencesPromiseClient.prototype.listReferences =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.references.References/ListReferences',
      request,
      metadata || {},
      methodDescriptor_References_ListReferences);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.references.WriteFriendReferenceReq,
 *   !proto.org.couchers.api.references.Reference>}
 */
const methodDescriptor_References_WriteFriendReference = new grpc.web.MethodDescriptor(
  '/org.couchers.api.references.References/WriteFriendReference',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.references.WriteFriendReferenceReq,
  proto.org.couchers.api.references.Reference,
  /**
   * @param {!proto.org.couchers.api.references.WriteFriendReferenceReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.references.Reference.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.references.WriteFriendReferenceReq,
 *   !proto.org.couchers.api.references.Reference>}
 */
const methodInfo_References_WriteFriendReference = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.references.Reference,
  /**
   * @param {!proto.org.couchers.api.references.WriteFriendReferenceReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.references.Reference.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.references.WriteFriendReferenceReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.references.Reference)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.references.Reference>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.references.ReferencesClient.prototype.writeFriendReference =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.references.References/WriteFriendReference',
      request,
      metadata || {},
      methodDescriptor_References_WriteFriendReference,
      callback);
};


/**
 * @param {!proto.org.couchers.api.references.WriteFriendReferenceReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.references.Reference>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.references.ReferencesPromiseClient.prototype.writeFriendReference =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.references.References/WriteFriendReference',
      request,
      metadata || {},
      methodDescriptor_References_WriteFriendReference);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.references.WriteHostRequestReferenceReq,
 *   !proto.org.couchers.api.references.Reference>}
 */
const methodDescriptor_References_WriteHostRequestReference = new grpc.web.MethodDescriptor(
  '/org.couchers.api.references.References/WriteHostRequestReference',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.references.WriteHostRequestReferenceReq,
  proto.org.couchers.api.references.Reference,
  /**
   * @param {!proto.org.couchers.api.references.WriteHostRequestReferenceReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.references.Reference.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.references.WriteHostRequestReferenceReq,
 *   !proto.org.couchers.api.references.Reference>}
 */
const methodInfo_References_WriteHostRequestReference = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.references.Reference,
  /**
   * @param {!proto.org.couchers.api.references.WriteHostRequestReferenceReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.references.Reference.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.references.WriteHostRequestReferenceReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.references.Reference)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.references.Reference>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.references.ReferencesClient.prototype.writeHostRequestReference =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.references.References/WriteHostRequestReference',
      request,
      metadata || {},
      methodDescriptor_References_WriteHostRequestReference,
      callback);
};


/**
 * @param {!proto.org.couchers.api.references.WriteHostRequestReferenceReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.references.Reference>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.references.ReferencesPromiseClient.prototype.writeHostRequestReference =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.references.References/WriteHostRequestReference',
      request,
      metadata || {},
      methodDescriptor_References_WriteHostRequestReference);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.references.AvailableWriteReferencesReq,
 *   !proto.org.couchers.api.references.AvailableWriteReferencesRes>}
 */
const methodDescriptor_References_AvailableWriteReferences = new grpc.web.MethodDescriptor(
  '/org.couchers.api.references.References/AvailableWriteReferences',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.references.AvailableWriteReferencesReq,
  proto.org.couchers.api.references.AvailableWriteReferencesRes,
  /**
   * @param {!proto.org.couchers.api.references.AvailableWriteReferencesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.references.AvailableWriteReferencesRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.references.AvailableWriteReferencesReq,
 *   !proto.org.couchers.api.references.AvailableWriteReferencesRes>}
 */
const methodInfo_References_AvailableWriteReferences = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.references.AvailableWriteReferencesRes,
  /**
   * @param {!proto.org.couchers.api.references.AvailableWriteReferencesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.references.AvailableWriteReferencesRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.references.AvailableWriteReferencesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.references.AvailableWriteReferencesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.references.AvailableWriteReferencesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.references.ReferencesClient.prototype.availableWriteReferences =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.references.References/AvailableWriteReferences',
      request,
      metadata || {},
      methodDescriptor_References_AvailableWriteReferences,
      callback);
};


/**
 * @param {!proto.org.couchers.api.references.AvailableWriteReferencesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.references.AvailableWriteReferencesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.references.ReferencesPromiseClient.prototype.availableWriteReferences =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.references.References/AvailableWriteReferences',
      request,
      metadata || {},
      methodDescriptor_References_AvailableWriteReferences);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.api.references.ListPendingReferencesToWriteRes>}
 */
const methodDescriptor_References_ListPendingReferencesToWrite = new grpc.web.MethodDescriptor(
  '/org.couchers.api.references.References/ListPendingReferencesToWrite',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.org.couchers.api.references.ListPendingReferencesToWriteRes,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.references.ListPendingReferencesToWriteRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.api.references.ListPendingReferencesToWriteRes>}
 */
const methodInfo_References_ListPendingReferencesToWrite = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.references.ListPendingReferencesToWriteRes,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.references.ListPendingReferencesToWriteRes.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.references.ListPendingReferencesToWriteRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.references.ListPendingReferencesToWriteRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.references.ReferencesClient.prototype.listPendingReferencesToWrite =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.references.References/ListPendingReferencesToWrite',
      request,
      metadata || {},
      methodDescriptor_References_ListPendingReferencesToWrite,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.references.ListPendingReferencesToWriteRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.references.ReferencesPromiseClient.prototype.listPendingReferencesToWrite =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.references.References/ListPendingReferencesToWrite',
      request,
      metadata || {},
      methodDescriptor_References_ListPendingReferencesToWrite);
};


module.exports = proto.org.couchers.api.references;

