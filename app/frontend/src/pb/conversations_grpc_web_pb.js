/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.conversations
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
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.conversations = require('./conversations_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.conversations.ConversationsClient =
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
proto.org.couchers.api.conversations.ConversationsPromiseClient =
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
 *   !proto.org.couchers.api.conversations.ListGroupChatsReq,
 *   !proto.org.couchers.api.conversations.ListGroupChatsRes>}
 */
const methodDescriptor_Conversations_ListGroupChats = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/ListGroupChats',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.ListGroupChatsReq,
  proto.org.couchers.api.conversations.ListGroupChatsRes,
  /**
   * @param {!proto.org.couchers.api.conversations.ListGroupChatsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.ListGroupChatsRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.conversations.ListGroupChatsReq,
 *   !proto.org.couchers.api.conversations.ListGroupChatsRes>}
 */
const methodInfo_Conversations_ListGroupChats = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.conversations.ListGroupChatsRes,
  /**
   * @param {!proto.org.couchers.api.conversations.ListGroupChatsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.ListGroupChatsRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.ListGroupChatsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.conversations.ListGroupChatsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.conversations.ListGroupChatsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.listGroupChats =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/ListGroupChats',
      request,
      metadata || {},
      methodDescriptor_Conversations_ListGroupChats,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.ListGroupChatsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.conversations.ListGroupChatsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.listGroupChats =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/ListGroupChats',
      request,
      metadata || {},
      methodDescriptor_Conversations_ListGroupChats);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.GetGroupChatReq,
 *   !proto.org.couchers.api.conversations.GroupChat>}
 */
const methodDescriptor_Conversations_GetGroupChat = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/GetGroupChat',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.GetGroupChatReq,
  proto.org.couchers.api.conversations.GroupChat,
  /**
   * @param {!proto.org.couchers.api.conversations.GetGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.GroupChat.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.conversations.GetGroupChatReq,
 *   !proto.org.couchers.api.conversations.GroupChat>}
 */
const methodInfo_Conversations_GetGroupChat = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.conversations.GroupChat,
  /**
   * @param {!proto.org.couchers.api.conversations.GetGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.GroupChat.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.GetGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.conversations.GroupChat)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.conversations.GroupChat>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.getGroupChat =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/GetGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetGroupChat,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.GetGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.conversations.GroupChat>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.getGroupChat =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/GetGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetGroupChat);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.GetDirectMessageReq,
 *   !proto.org.couchers.api.conversations.GroupChat>}
 */
const methodDescriptor_Conversations_GetDirectMessage = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/GetDirectMessage',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.GetDirectMessageReq,
  proto.org.couchers.api.conversations.GroupChat,
  /**
   * @param {!proto.org.couchers.api.conversations.GetDirectMessageReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.GroupChat.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.conversations.GetDirectMessageReq,
 *   !proto.org.couchers.api.conversations.GroupChat>}
 */
const methodInfo_Conversations_GetDirectMessage = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.conversations.GroupChat,
  /**
   * @param {!proto.org.couchers.api.conversations.GetDirectMessageReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.GroupChat.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.GetDirectMessageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.conversations.GroupChat)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.conversations.GroupChat>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.getDirectMessage =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/GetDirectMessage',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetDirectMessage,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.GetDirectMessageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.conversations.GroupChat>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.getDirectMessage =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/GetDirectMessage',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetDirectMessage);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.GetUpdatesReq,
 *   !proto.org.couchers.api.conversations.GetUpdatesRes>}
 */
const methodDescriptor_Conversations_GetUpdates = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/GetUpdates',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.GetUpdatesReq,
  proto.org.couchers.api.conversations.GetUpdatesRes,
  /**
   * @param {!proto.org.couchers.api.conversations.GetUpdatesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.GetUpdatesRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.conversations.GetUpdatesReq,
 *   !proto.org.couchers.api.conversations.GetUpdatesRes>}
 */
const methodInfo_Conversations_GetUpdates = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.conversations.GetUpdatesRes,
  /**
   * @param {!proto.org.couchers.api.conversations.GetUpdatesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.GetUpdatesRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.GetUpdatesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.conversations.GetUpdatesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.conversations.GetUpdatesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.getUpdates =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/GetUpdates',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetUpdates,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.GetUpdatesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.conversations.GetUpdatesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.getUpdates =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/GetUpdates',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetUpdates);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.GetGroupChatMessagesReq,
 *   !proto.org.couchers.api.conversations.GetGroupChatMessagesRes>}
 */
const methodDescriptor_Conversations_GetGroupChatMessages = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/GetGroupChatMessages',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.GetGroupChatMessagesReq,
  proto.org.couchers.api.conversations.GetGroupChatMessagesRes,
  /**
   * @param {!proto.org.couchers.api.conversations.GetGroupChatMessagesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.GetGroupChatMessagesRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.conversations.GetGroupChatMessagesReq,
 *   !proto.org.couchers.api.conversations.GetGroupChatMessagesRes>}
 */
const methodInfo_Conversations_GetGroupChatMessages = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.conversations.GetGroupChatMessagesRes,
  /**
   * @param {!proto.org.couchers.api.conversations.GetGroupChatMessagesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.GetGroupChatMessagesRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.GetGroupChatMessagesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.conversations.GetGroupChatMessagesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.conversations.GetGroupChatMessagesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.getGroupChatMessages =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/GetGroupChatMessages',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetGroupChatMessages,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.GetGroupChatMessagesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.conversations.GetGroupChatMessagesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.getGroupChatMessages =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/GetGroupChatMessages',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetGroupChatMessages);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.MarkLastSeenGroupChatReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_MarkLastSeenGroupChat = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/MarkLastSeenGroupChat',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.MarkLastSeenGroupChatReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.MarkLastSeenGroupChatReq} request
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
 *   !proto.org.couchers.api.conversations.MarkLastSeenGroupChatReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_MarkLastSeenGroupChat = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.MarkLastSeenGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.MarkLastSeenGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.markLastSeenGroupChat =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/MarkLastSeenGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_MarkLastSeenGroupChat,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.MarkLastSeenGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.markLastSeenGroupChat =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/MarkLastSeenGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_MarkLastSeenGroupChat);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.CreateGroupChatReq,
 *   !proto.org.couchers.api.conversations.GroupChat>}
 */
const methodDescriptor_Conversations_CreateGroupChat = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/CreateGroupChat',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.CreateGroupChatReq,
  proto.org.couchers.api.conversations.GroupChat,
  /**
   * @param {!proto.org.couchers.api.conversations.CreateGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.GroupChat.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.conversations.CreateGroupChatReq,
 *   !proto.org.couchers.api.conversations.GroupChat>}
 */
const methodInfo_Conversations_CreateGroupChat = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.conversations.GroupChat,
  /**
   * @param {!proto.org.couchers.api.conversations.CreateGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.GroupChat.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.CreateGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.conversations.GroupChat)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.conversations.GroupChat>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.createGroupChat =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/CreateGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_CreateGroupChat,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.CreateGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.conversations.GroupChat>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.createGroupChat =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/CreateGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_CreateGroupChat);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.EditGroupChatReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_EditGroupChat = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/EditGroupChat',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.EditGroupChatReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.EditGroupChatReq} request
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
 *   !proto.org.couchers.api.conversations.EditGroupChatReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_EditGroupChat = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.EditGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.EditGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.editGroupChat =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/EditGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_EditGroupChat,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.EditGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.editGroupChat =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/EditGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_EditGroupChat);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.InviteToGroupChatReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_InviteToGroupChat = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/InviteToGroupChat',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.InviteToGroupChatReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.InviteToGroupChatReq} request
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
 *   !proto.org.couchers.api.conversations.InviteToGroupChatReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_InviteToGroupChat = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.InviteToGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.InviteToGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.inviteToGroupChat =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/InviteToGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_InviteToGroupChat,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.InviteToGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.inviteToGroupChat =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/InviteToGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_InviteToGroupChat);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.MakeGroupChatAdminReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_MakeGroupChatAdmin = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/MakeGroupChatAdmin',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.MakeGroupChatAdminReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.MakeGroupChatAdminReq} request
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
 *   !proto.org.couchers.api.conversations.MakeGroupChatAdminReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_MakeGroupChatAdmin = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.MakeGroupChatAdminReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.MakeGroupChatAdminReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.makeGroupChatAdmin =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/MakeGroupChatAdmin',
      request,
      metadata || {},
      methodDescriptor_Conversations_MakeGroupChatAdmin,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.MakeGroupChatAdminReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.makeGroupChatAdmin =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/MakeGroupChatAdmin',
      request,
      metadata || {},
      methodDescriptor_Conversations_MakeGroupChatAdmin);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.RemoveGroupChatUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_RemoveGroupChatUser = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/RemoveGroupChatUser',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.RemoveGroupChatUserReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.RemoveGroupChatUserReq} request
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
 *   !proto.org.couchers.api.conversations.RemoveGroupChatUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_RemoveGroupChatUser = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.RemoveGroupChatUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.RemoveGroupChatUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.removeGroupChatUser =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/RemoveGroupChatUser',
      request,
      metadata || {},
      methodDescriptor_Conversations_RemoveGroupChatUser,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.RemoveGroupChatUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.removeGroupChatUser =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/RemoveGroupChatUser',
      request,
      metadata || {},
      methodDescriptor_Conversations_RemoveGroupChatUser);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.RemoveGroupChatAdminReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_RemoveGroupChatAdmin = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/RemoveGroupChatAdmin',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.RemoveGroupChatAdminReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.RemoveGroupChatAdminReq} request
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
 *   !proto.org.couchers.api.conversations.RemoveGroupChatAdminReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_RemoveGroupChatAdmin = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.RemoveGroupChatAdminReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.RemoveGroupChatAdminReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.removeGroupChatAdmin =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/RemoveGroupChatAdmin',
      request,
      metadata || {},
      methodDescriptor_Conversations_RemoveGroupChatAdmin,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.RemoveGroupChatAdminReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.removeGroupChatAdmin =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/RemoveGroupChatAdmin',
      request,
      metadata || {},
      methodDescriptor_Conversations_RemoveGroupChatAdmin);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.SendMessageReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_SendMessage = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/SendMessage',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.SendMessageReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.SendMessageReq} request
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
 *   !proto.org.couchers.api.conversations.SendMessageReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_SendMessage = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.SendMessageReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.SendMessageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.sendMessage =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/SendMessage',
      request,
      metadata || {},
      methodDescriptor_Conversations_SendMessage,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.SendMessageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.sendMessage =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/SendMessage',
      request,
      metadata || {},
      methodDescriptor_Conversations_SendMessage);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.LeaveGroupChatReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_LeaveGroupChat = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/LeaveGroupChat',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.LeaveGroupChatReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.LeaveGroupChatReq} request
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
 *   !proto.org.couchers.api.conversations.LeaveGroupChatReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_LeaveGroupChat = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.conversations.LeaveGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.LeaveGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.leaveGroupChat =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/LeaveGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_LeaveGroupChat,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.LeaveGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.leaveGroupChat =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/LeaveGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_LeaveGroupChat);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.conversations.SearchMessagesReq,
 *   !proto.org.couchers.api.conversations.SearchMessagesRes>}
 */
const methodDescriptor_Conversations_SearchMessages = new grpc.web.MethodDescriptor(
  '/org.couchers.api.conversations.Conversations/SearchMessages',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.conversations.SearchMessagesReq,
  proto.org.couchers.api.conversations.SearchMessagesRes,
  /**
   * @param {!proto.org.couchers.api.conversations.SearchMessagesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.SearchMessagesRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.conversations.SearchMessagesReq,
 *   !proto.org.couchers.api.conversations.SearchMessagesRes>}
 */
const methodInfo_Conversations_SearchMessages = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.conversations.SearchMessagesRes,
  /**
   * @param {!proto.org.couchers.api.conversations.SearchMessagesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.conversations.SearchMessagesRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.conversations.SearchMessagesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.conversations.SearchMessagesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.conversations.SearchMessagesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.conversations.ConversationsClient.prototype.searchMessages =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/SearchMessages',
      request,
      metadata || {},
      methodDescriptor_Conversations_SearchMessages,
      callback);
};


/**
 * @param {!proto.org.couchers.api.conversations.SearchMessagesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.conversations.SearchMessagesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.conversations.ConversationsPromiseClient.prototype.searchMessages =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.conversations.Conversations/SearchMessages',
      request,
      metadata || {},
      methodDescriptor_Conversations_SearchMessages);
};


module.exports = proto.org.couchers.api.conversations;

