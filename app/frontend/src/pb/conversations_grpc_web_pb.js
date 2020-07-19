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
 *   !proto.conversations.ListGroupChatsReq,
 *   !proto.conversations.ListGroupChatsRes>}
 */
const methodDescriptor_Conversations_ListGroupChats = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/ListGroupChats',
  grpc.web.MethodType.UNARY,
  proto.conversations.ListGroupChatsReq,
  proto.conversations.ListGroupChatsRes,
  /**
   * @param {!proto.conversations.ListGroupChatsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.ListGroupChatsRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.ListGroupChatsReq,
 *   !proto.conversations.ListGroupChatsRes>}
 */
const methodInfo_Conversations_ListGroupChats = new grpc.web.AbstractClientBase.MethodInfo(
  proto.conversations.ListGroupChatsRes,
  /**
   * @param {!proto.conversations.ListGroupChatsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.ListGroupChatsRes.deserializeBinary
);


/**
 * @param {!proto.conversations.ListGroupChatsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.conversations.ListGroupChatsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.conversations.ListGroupChatsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.listGroupChats =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/ListGroupChats',
      request,
      metadata || {},
      methodDescriptor_Conversations_ListGroupChats,
      callback);
};


/**
 * @param {!proto.conversations.ListGroupChatsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.conversations.ListGroupChatsRes>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.listGroupChats =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/ListGroupChats',
      request,
      metadata || {},
      methodDescriptor_Conversations_ListGroupChats);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.GetGroupChatReq,
 *   !proto.conversations.GroupChat>}
 */
const methodDescriptor_Conversations_GetGroupChat = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/GetGroupChat',
  grpc.web.MethodType.UNARY,
  proto.conversations.GetGroupChatReq,
  proto.conversations.GroupChat,
  /**
   * @param {!proto.conversations.GetGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.GroupChat.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.GetGroupChatReq,
 *   !proto.conversations.GroupChat>}
 */
const methodInfo_Conversations_GetGroupChat = new grpc.web.AbstractClientBase.MethodInfo(
  proto.conversations.GroupChat,
  /**
   * @param {!proto.conversations.GetGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.GroupChat.deserializeBinary
);


/**
 * @param {!proto.conversations.GetGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.conversations.GroupChat)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.conversations.GroupChat>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.getGroupChat =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/GetGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetGroupChat,
      callback);
};


/**
 * @param {!proto.conversations.GetGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.conversations.GroupChat>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.getGroupChat =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/GetGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetGroupChat);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.GetGroupChatMessagesReq,
 *   !proto.conversations.GetGroupChatMessagesRes>}
 */
const methodDescriptor_Conversations_GetGroupChatMessages = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/GetGroupChatMessages',
  grpc.web.MethodType.UNARY,
  proto.conversations.GetGroupChatMessagesReq,
  proto.conversations.GetGroupChatMessagesRes,
  /**
   * @param {!proto.conversations.GetGroupChatMessagesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.GetGroupChatMessagesRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.GetGroupChatMessagesReq,
 *   !proto.conversations.GetGroupChatMessagesRes>}
 */
const methodInfo_Conversations_GetGroupChatMessages = new grpc.web.AbstractClientBase.MethodInfo(
  proto.conversations.GetGroupChatMessagesRes,
  /**
   * @param {!proto.conversations.GetGroupChatMessagesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.GetGroupChatMessagesRes.deserializeBinary
);


/**
 * @param {!proto.conversations.GetGroupChatMessagesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.conversations.GetGroupChatMessagesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.conversations.GetGroupChatMessagesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.getGroupChatMessages =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/GetGroupChatMessages',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetGroupChatMessages,
      callback);
};


/**
 * @param {!proto.conversations.GetGroupChatMessagesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.conversations.GetGroupChatMessagesRes>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.getGroupChatMessages =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/GetGroupChatMessages',
      request,
      metadata || {},
      methodDescriptor_Conversations_GetGroupChatMessages);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.CreateGroupChatReq,
 *   !proto.conversations.GroupChat>}
 */
const methodDescriptor_Conversations_CreateGroupChat = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/CreateGroupChat',
  grpc.web.MethodType.UNARY,
  proto.conversations.CreateGroupChatReq,
  proto.conversations.GroupChat,
  /**
   * @param {!proto.conversations.CreateGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.GroupChat.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.conversations.CreateGroupChatReq,
 *   !proto.conversations.GroupChat>}
 */
const methodInfo_Conversations_CreateGroupChat = new grpc.web.AbstractClientBase.MethodInfo(
  proto.conversations.GroupChat,
  /**
   * @param {!proto.conversations.CreateGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.conversations.GroupChat.deserializeBinary
);


/**
 * @param {!proto.conversations.CreateGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.conversations.GroupChat)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.conversations.GroupChat>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.createGroupChat =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/CreateGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_CreateGroupChat,
      callback);
};


/**
 * @param {!proto.conversations.CreateGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.conversations.GroupChat>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.createGroupChat =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/CreateGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_CreateGroupChat);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.EditGroupChatReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_EditGroupChat = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/EditGroupChat',
  grpc.web.MethodType.UNARY,
  proto.conversations.EditGroupChatReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.EditGroupChatReq} request
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
 *   !proto.conversations.EditGroupChatReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_EditGroupChat = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.EditGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.conversations.EditGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.editGroupChat =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/EditGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_EditGroupChat,
      callback);
};


/**
 * @param {!proto.conversations.EditGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.editGroupChat =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/EditGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_EditGroupChat);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.MakeGroupChatAdminReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_MakeGroupChatAdmin = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/MakeGroupChatAdmin',
  grpc.web.MethodType.UNARY,
  proto.conversations.MakeGroupChatAdminReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.MakeGroupChatAdminReq} request
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
 *   !proto.conversations.MakeGroupChatAdminReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_MakeGroupChatAdmin = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.MakeGroupChatAdminReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.conversations.MakeGroupChatAdminReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.makeGroupChatAdmin =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/MakeGroupChatAdmin',
      request,
      metadata || {},
      methodDescriptor_Conversations_MakeGroupChatAdmin,
      callback);
};


/**
 * @param {!proto.conversations.MakeGroupChatAdminReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.makeGroupChatAdmin =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/MakeGroupChatAdmin',
      request,
      metadata || {},
      methodDescriptor_Conversations_MakeGroupChatAdmin);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.conversations.RemoveGroupChatAdminReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_RemoveGroupChatAdmin = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/RemoveGroupChatAdmin',
  grpc.web.MethodType.UNARY,
  proto.conversations.RemoveGroupChatAdminReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.RemoveGroupChatAdminReq} request
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
 *   !proto.conversations.RemoveGroupChatAdminReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_RemoveGroupChatAdmin = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.RemoveGroupChatAdminReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.conversations.RemoveGroupChatAdminReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.removeGroupChatAdmin =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/RemoveGroupChatAdmin',
      request,
      metadata || {},
      methodDescriptor_Conversations_RemoveGroupChatAdmin,
      callback);
};


/**
 * @param {!proto.conversations.RemoveGroupChatAdminReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.removeGroupChatAdmin =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/RemoveGroupChatAdmin',
      request,
      metadata || {},
      methodDescriptor_Conversations_RemoveGroupChatAdmin);
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
 *   !proto.conversations.LeaveGroupChatReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Conversations_LeaveGroupChat = new grpc.web.MethodDescriptor(
  '/conversations.Conversations/LeaveGroupChat',
  grpc.web.MethodType.UNARY,
  proto.conversations.LeaveGroupChatReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.LeaveGroupChatReq} request
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
 *   !proto.conversations.LeaveGroupChatReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Conversations_LeaveGroupChat = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.conversations.LeaveGroupChatReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.conversations.LeaveGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.conversations.ConversationsClient.prototype.leaveGroupChat =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/conversations.Conversations/LeaveGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_LeaveGroupChat,
      callback);
};


/**
 * @param {!proto.conversations.LeaveGroupChatReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.conversations.ConversationsPromiseClient.prototype.leaveGroupChat =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/conversations.Conversations/LeaveGroupChat',
      request,
      metadata || {},
      methodDescriptor_Conversations_LeaveGroupChat);
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

