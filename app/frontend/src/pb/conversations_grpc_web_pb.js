/**
 * @fileoverview gRPC-Web generated client stub for conversations
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');


var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js')

var google_protobuf_wrappers_pb = require('google-protobuf/google/protobuf/wrappers_pb.js')

var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js')
const proto = {};
proto.conversations = require('./conversations_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.conversations.ConversationsClient =
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
proto.conversations.ConversationsPromiseClient =
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
 *   !proto.conversations.ListMessageThreadsReq,
 *   !proto.conversations.ListMessageThreadsRes>}
 */
const methodDescriptor_Conversations_ListMessageThreads = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/ListMessageThreads',
  grpc.web.MethodType.UNARY,
  proto.conversations.ListMessageThreadsReq,
  proto.conversations.ListMessageThreadsRes,
  /**
   * @param {!proto.conversations.ListMessageThreadsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.ListMessageThreadsRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.ListMessageThreadsReq,
 *   !proto.conversations.ListMessageThreadsRes>}
 */
const methodInfo_Conversations_ListMessageThreads = new grpc.web.AbstractClientBase.MethodInfo(
  proto.conversations.ListMessageThreadsRes,
  /**
   * @param {!proto.conversations.ListMessageThreadsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.ListMessageThreadsRes.deserializeBinary
);


/**
 * @param {!proto.conversations.ListMessageThreadsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.conversations.ListMessageThreadsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.conversations.ListMessageThreadsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.listMessageThreads =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/ListMessageThreads',
      request,
      metadata || {},
      methodDescriptor_Conversations_ListMessageThreads,
      callback);
};


/**
 * @param {!proto.conversations.ListMessageThreadsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.conversations.ListMessageThreadsRes>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.listMessageThreads =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/ListMessageThreads',
      request,
      metadata || {},
      methodDescriptor_Conversations_ListMessageThreads);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.EditMessageThreadStatusReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_EditMessageThreadStatus = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/EditMessageThreadStatus',
  grpc.web.MethodType.UNARY,
  proto.conversations.EditMessageThreadStatusReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.EditMessageThreadStatusReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.EditMessageThreadStatusReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_EditMessageThreadStatus = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.EditMessageThreadStatusReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.conversations.EditMessageThreadStatusReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.editMessageThreadStatus =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/EditMessageThreadStatus',
      request,
      metadata || {},
      methodDescriptor_Conversations_EditMessageThreadStatus,
      callback);
};


/**
 * @param {!proto.conversations.EditMessageThreadStatusReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.editMessageThreadStatus =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/EditMessageThreadStatus',
      request,
      metadata || {},
      methodDescriptor_Conversations_EditMessageThreadStatus);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.GetMessageThreadReq,
 *   !proto.conversations.GetMessageThreadRes>}
 */
const methodDescriptor_Conversations_GetMessageThread = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/GetMessageThread',
  grpc.web.MethodType.UNARY,
  proto.conversations.GetMessageThreadReq,
  proto.conversations.GetMessageThreadRes,
  /**
   * @param {!proto.conversations.GetMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.GetMessageThreadRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.GetMessageThreadReq,
 *   !proto.conversations.GetMessageThreadRes>}
 */
const methodInfo_Conversations_GetMessageThread = new grpc.web.AbstractClientBase.MethodInfo(
  proto.conversations.GetMessageThreadRes,
  /**
   * @param {!proto.conversations.GetMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.GetMessageThreadRes.deserializeBinary
);


/**
 * @param {!proto.conversations.GetMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.conversations.GetMessageThreadRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.conversations.GetMessageThreadRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.getMessageThread =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/GetMessageThread',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetMessageThread,
      callback);
};


/**
 * @param {!proto.conversations.GetMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.conversations.GetMessageThreadRes>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.getMessageThread =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/GetMessageThread',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetMessageThread);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.GetMessageThreadInfoReq,
 *   !proto.conversations.GetMessageThreadInfoRes>}
 */
const methodDescriptor_Conversations_GetMessageThreadInfo = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/GetMessageThreadInfo',
  grpc.web.MethodType.UNARY,
  proto.conversations.GetMessageThreadInfoReq,
  proto.conversations.GetMessageThreadInfoRes,
  /**
   * @param {!proto.conversations.GetMessageThreadInfoReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.GetMessageThreadInfoRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.GetMessageThreadInfoReq,
 *   !proto.conversations.GetMessageThreadInfoRes>}
 */
const methodInfo_Conversations_GetMessageThreadInfo = new grpc.web.AbstractClientBase.MethodInfo(
  proto.conversations.GetMessageThreadInfoRes,
  /**
   * @param {!proto.conversations.GetMessageThreadInfoReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.GetMessageThreadInfoRes.deserializeBinary
);


/**
 * @param {!proto.conversations.GetMessageThreadInfoReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.conversations.GetMessageThreadInfoRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.conversations.GetMessageThreadInfoRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.getMessageThreadInfo =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/GetMessageThreadInfo',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetMessageThreadInfo,
      callback);
};


/**
 * @param {!proto.conversations.GetMessageThreadInfoReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.conversations.GetMessageThreadInfoRes>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.getMessageThreadInfo =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/GetMessageThreadInfo',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetMessageThreadInfo);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.CreateMessageThreadReq,
 *   !proto.conversations.CreateMessageThreadRes>}
 */
const methodDescriptor_Conversations_CreateMessageThread = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/CreateMessageThread',
  grpc.web.MethodType.UNARY,
  proto.conversations.CreateMessageThreadReq,
  proto.conversations.CreateMessageThreadRes,
  /**
   * @param {!proto.conversations.CreateMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.CreateMessageThreadRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.CreateMessageThreadReq,
 *   !proto.conversations.CreateMessageThreadRes>}
 */
const methodInfo_Conversations_CreateMessageThread = new grpc.web.AbstractClientBase.MethodInfo(
  proto.conversations.CreateMessageThreadRes,
  /**
   * @param {!proto.conversations.CreateMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.CreateMessageThreadRes.deserializeBinary
);


/**
 * @param {!proto.conversations.CreateMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.conversations.CreateMessageThreadRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.conversations.CreateMessageThreadRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.createMessageThread =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/CreateMessageThread',
      request,
      metadata || {},
      methodDescriptor_Conversations_CreateMessageThread,
      callback);
};


/**
 * @param {!proto.conversations.CreateMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.conversations.CreateMessageThreadRes>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.createMessageThread =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/CreateMessageThread',
      request,
      metadata || {},
      methodDescriptor_Conversations_CreateMessageThread);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.EditMessageThreadReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_EditMessageThread = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/EditMessageThread',
  grpc.web.MethodType.UNARY,
  proto.conversations.EditMessageThreadReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.EditMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.EditMessageThreadReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_EditMessageThread = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.EditMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.conversations.EditMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.editMessageThread =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/EditMessageThread',
      request,
      metadata || {},
      methodDescriptor_Conversations_EditMessageThread,
      callback);
};


/**
 * @param {!proto.conversations.EditMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.editMessageThread =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/EditMessageThread',
      request,
      metadata || {},
      methodDescriptor_Conversations_EditMessageThread);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.ThreadUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_MakeMessageThreadAdmin = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/MakeMessageThreadAdmin',
  grpc.web.MethodType.UNARY,
  proto.conversations.ThreadUserReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.ThreadUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.ThreadUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_MakeMessageThreadAdmin = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.ThreadUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.conversations.ThreadUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.makeMessageThreadAdmin =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/MakeMessageThreadAdmin',
      request,
      metadata || {},
      methodDescriptor_Conversations_MakeMessageThreadAdmin,
      callback);
};


/**
 * @param {!proto.conversations.ThreadUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.makeMessageThreadAdmin =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/MakeMessageThreadAdmin',
      request,
      metadata || {},
      methodDescriptor_Conversations_MakeMessageThreadAdmin);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.ThreadUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_RemoveMessageThreadAdmin = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/RemoveMessageThreadAdmin',
  grpc.web.MethodType.UNARY,
  proto.conversations.ThreadUserReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.ThreadUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.ThreadUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_RemoveMessageThreadAdmin = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.ThreadUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.conversations.ThreadUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.removeMessageThreadAdmin =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/RemoveMessageThreadAdmin',
      request,
      metadata || {},
      methodDescriptor_Conversations_RemoveMessageThreadAdmin,
      callback);
};


/**
 * @param {!proto.conversations.ThreadUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.removeMessageThreadAdmin =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/RemoveMessageThreadAdmin',
      request,
      metadata || {},
      methodDescriptor_Conversations_RemoveMessageThreadAdmin);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.SendMessageReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_SendMessage = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/SendMessage',
  grpc.web.MethodType.UNARY,
  proto.conversations.SendMessageReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.SendMessageReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.SendMessageReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_SendMessage = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.SendMessageReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.conversations.SendMessageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.sendMessage =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/SendMessage',
      request,
      metadata || {},
      methodDescriptor_Conversations_SendMessage,
      callback);
};


/**
 * @param {!proto.conversations.SendMessageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.sendMessage =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/SendMessage',
      request,
      metadata || {},
      methodDescriptor_Conversations_SendMessage);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.LeaveMessageThreadReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_LeaveMessageThread = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/LeaveMessageThread',
  grpc.web.MethodType.UNARY,
  proto.conversations.LeaveMessageThreadReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.LeaveMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.LeaveMessageThreadReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_LeaveMessageThread = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.LeaveMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.conversations.LeaveMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.leaveMessageThread =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/LeaveMessageThread',
      request,
      metadata || {},
      methodDescriptor_Conversations_LeaveMessageThread,
      callback);
};


/**
 * @param {!proto.conversations.LeaveMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.leaveMessageThread =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/LeaveMessageThread',
      request,
      metadata || {},
      methodDescriptor_Conversations_LeaveMessageThread);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.ThreadUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_InviteToMessageThread = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/InviteToMessageThread',
  grpc.web.MethodType.UNARY,
  proto.conversations.ThreadUserReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.ThreadUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.ThreadUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_InviteToMessageThread = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.ThreadUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.conversations.ThreadUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.inviteToMessageThread =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/InviteToMessageThread',
      request,
      metadata || {},
      methodDescriptor_Conversations_InviteToMessageThread,
      callback);
};


/**
 * @param {!proto.conversations.ThreadUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.inviteToMessageThread =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/InviteToMessageThread',
      request,
      metadata || {},
      methodDescriptor_Conversations_InviteToMessageThread);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.SearchMessagesReq,
 *   !proto.conversations.SearchMessagesRes>}
 */
const methodDescriptor_Conversations_SearchMessages = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/SearchMessages',
  grpc.web.MethodType.UNARY,
  proto.conversations.SearchMessagesReq,
  proto.conversations.SearchMessagesRes,
  /**
   * @param {!proto.conversations.SearchMessagesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.SearchMessagesRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.SearchMessagesReq,
 *   !proto.conversations.SearchMessagesRes>}
 */
const methodInfo_Conversations_SearchMessages = new grpc.web.AbstractClientBase.MethodInfo(
  proto.conversations.SearchMessagesRes,
  /**
   * @param {!proto.conversations.SearchMessagesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.SearchMessagesRes.deserializeBinary
);


/**
 * @param {!proto.conversations.SearchMessagesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.conversations.SearchMessagesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.conversations.SearchMessagesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.searchMessages =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/SearchMessages',
      request,
      metadata || {},
      methodDescriptor_Conversations_SearchMessages,
      callback);
};


/**
 * @param {!proto.conversations.SearchMessagesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.conversations.SearchMessagesRes>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.searchMessages =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/SearchMessages',
      request,
      metadata || {},
      methodDescriptor_Conversations_SearchMessages);
};


module.exports = proto.conversations;

