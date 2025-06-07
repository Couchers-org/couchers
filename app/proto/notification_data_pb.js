// source: notification_data.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global =
    (typeof globalThis !== 'undefined' && globalThis) ||
    (typeof window !== 'undefined' && window) ||
    (typeof global !== 'undefined' && global) ||
    (typeof self !== 'undefined' && self) ||
    (function () { return this; }).call(null) ||
    Function('return this')();

var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');
goog.object.extend(proto, google_protobuf_timestamp_pb);
var api_pb = require('./api_pb.js');
goog.object.extend(proto, api_pb);
var communities_pb = require('./communities_pb.js');
goog.object.extend(proto, communities_pb);
var discussions_pb = require('./discussions_pb.js');
goog.object.extend(proto, discussions_pb);
var events_pb = require('./events_pb.js');
goog.object.extend(proto, events_pb);
var requests_pb = require('./requests_pb.js');
goog.object.extend(proto, requests_pb);
var threads_pb = require('./threads_pb.js');
goog.object.extend(proto, threads_pb);
goog.exportSymbol('proto.org.couchers.notification_data.AccountDeletionComplete', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.AccountDeletionStart', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.ActivenessProbe', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.ApiKeyCreate', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.BadgeAdd', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.BadgeRemove', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.BirthdateChange', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.ChatMessage', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.ChatMissedMessages', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.DiscussionComment', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.DiscussionCreate', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.DonationReceived', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.EmailAddressChange', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.EventCancel', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.EventComment', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.EventCreate', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.EventCreate.NotificationReasonCase', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.EventDelete', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.EventInviteOrganizer', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.EventUpdate', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.FriendRequestAccept', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.FriendRequestCreate', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.GenderChange', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.GeneralNewBlogPost', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.HostRequestAccept', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.HostRequestCancel', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.HostRequestConfirm', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.HostRequestCreate', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.HostRequestMessage', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.HostRequestMissedMessages', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.HostRequestReject', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.PasswordResetStart', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.PhoneNumberChange', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.PhoneNumberVerify', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.ReferenceReceiveFriend', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.ReferenceReceiveHostRequest', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.ReferenceReminder', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.SVFailReason', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.ThreadReply', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.ThreadReply.ReplyParentCase', null, global);
goog.exportSymbol('proto.org.couchers.notification_data.VerificationSVFail', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.HostRequestCreate = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.HostRequestCreate, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.HostRequestCreate.displayName = 'proto.org.couchers.notification_data.HostRequestCreate';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.HostRequestAccept = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.HostRequestAccept, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.HostRequestAccept.displayName = 'proto.org.couchers.notification_data.HostRequestAccept';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.HostRequestReject = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.HostRequestReject, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.HostRequestReject.displayName = 'proto.org.couchers.notification_data.HostRequestReject';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.HostRequestConfirm = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.HostRequestConfirm, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.HostRequestConfirm.displayName = 'proto.org.couchers.notification_data.HostRequestConfirm';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.HostRequestCancel = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.HostRequestCancel, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.HostRequestCancel.displayName = 'proto.org.couchers.notification_data.HostRequestCancel';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.HostRequestMessage = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.HostRequestMessage, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.HostRequestMessage.displayName = 'proto.org.couchers.notification_data.HostRequestMessage';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.HostRequestMissedMessages = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.HostRequestMissedMessages, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.HostRequestMissedMessages.displayName = 'proto.org.couchers.notification_data.HostRequestMissedMessages';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.BadgeAdd = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.BadgeAdd, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.BadgeAdd.displayName = 'proto.org.couchers.notification_data.BadgeAdd';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.BadgeRemove = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.BadgeRemove, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.BadgeRemove.displayName = 'proto.org.couchers.notification_data.BadgeRemove';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.PhoneNumberChange = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.PhoneNumberChange, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.PhoneNumberChange.displayName = 'proto.org.couchers.notification_data.PhoneNumberChange';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.PhoneNumberVerify = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.PhoneNumberVerify, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.PhoneNumberVerify.displayName = 'proto.org.couchers.notification_data.PhoneNumberVerify';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.GenderChange = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.GenderChange, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.GenderChange.displayName = 'proto.org.couchers.notification_data.GenderChange';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.BirthdateChange = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.BirthdateChange, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.BirthdateChange.displayName = 'proto.org.couchers.notification_data.BirthdateChange';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.FriendRequestCreate = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.FriendRequestCreate, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.FriendRequestCreate.displayName = 'proto.org.couchers.notification_data.FriendRequestCreate';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.FriendRequestAccept = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.FriendRequestAccept, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.FriendRequestAccept.displayName = 'proto.org.couchers.notification_data.FriendRequestAccept';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.EmailAddressChange = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.EmailAddressChange, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.EmailAddressChange.displayName = 'proto.org.couchers.notification_data.EmailAddressChange';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.DonationReceived = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.DonationReceived, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.DonationReceived.displayName = 'proto.org.couchers.notification_data.DonationReceived';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.PasswordResetStart = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.PasswordResetStart, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.PasswordResetStart.displayName = 'proto.org.couchers.notification_data.PasswordResetStart';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.AccountDeletionStart = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.AccountDeletionStart, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.AccountDeletionStart.displayName = 'proto.org.couchers.notification_data.AccountDeletionStart';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.AccountDeletionComplete = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.AccountDeletionComplete, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.AccountDeletionComplete.displayName = 'proto.org.couchers.notification_data.AccountDeletionComplete';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.ApiKeyCreate = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.ApiKeyCreate, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.ApiKeyCreate.displayName = 'proto.org.couchers.notification_data.ApiKeyCreate';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.EventInviteOrganizer = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.EventInviteOrganizer, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.EventInviteOrganizer.displayName = 'proto.org.couchers.notification_data.EventInviteOrganizer';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.EventCreate = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.org.couchers.notification_data.EventCreate.oneofGroups_);
};
goog.inherits(proto.org.couchers.notification_data.EventCreate, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.EventCreate.displayName = 'proto.org.couchers.notification_data.EventCreate';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.EventUpdate = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.org.couchers.notification_data.EventUpdate.repeatedFields_, null);
};
goog.inherits(proto.org.couchers.notification_data.EventUpdate, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.EventUpdate.displayName = 'proto.org.couchers.notification_data.EventUpdate';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.EventCancel = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.EventCancel, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.EventCancel.displayName = 'proto.org.couchers.notification_data.EventCancel';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.EventDelete = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.EventDelete, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.EventDelete.displayName = 'proto.org.couchers.notification_data.EventDelete';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.ChatMessage = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.ChatMessage, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.ChatMessage.displayName = 'proto.org.couchers.notification_data.ChatMessage';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.ChatMissedMessages = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.org.couchers.notification_data.ChatMissedMessages.repeatedFields_, null);
};
goog.inherits(proto.org.couchers.notification_data.ChatMissedMessages, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.ChatMissedMessages.displayName = 'proto.org.couchers.notification_data.ChatMissedMessages';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.ReferenceReceiveFriend = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.ReferenceReceiveFriend, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.ReferenceReceiveFriend.displayName = 'proto.org.couchers.notification_data.ReferenceReceiveFriend';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.ReferenceReceiveHostRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.ReferenceReceiveHostRequest.displayName = 'proto.org.couchers.notification_data.ReferenceReceiveHostRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.ReferenceReminder = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.ReferenceReminder, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.ReferenceReminder.displayName = 'proto.org.couchers.notification_data.ReferenceReminder';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.VerificationSVFail = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.VerificationSVFail, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.VerificationSVFail.displayName = 'proto.org.couchers.notification_data.VerificationSVFail';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.EventComment = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.EventComment, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.EventComment.displayName = 'proto.org.couchers.notification_data.EventComment';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.DiscussionCreate = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.DiscussionCreate, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.DiscussionCreate.displayName = 'proto.org.couchers.notification_data.DiscussionCreate';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.DiscussionComment = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.DiscussionComment, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.DiscussionComment.displayName = 'proto.org.couchers.notification_data.DiscussionComment';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.ThreadReply = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.org.couchers.notification_data.ThreadReply.oneofGroups_);
};
goog.inherits(proto.org.couchers.notification_data.ThreadReply, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.ThreadReply.displayName = 'proto.org.couchers.notification_data.ThreadReply';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.ActivenessProbe = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.ActivenessProbe, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.ActivenessProbe.displayName = 'proto.org.couchers.notification_data.ActivenessProbe';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.org.couchers.notification_data.GeneralNewBlogPost = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.org.couchers.notification_data.GeneralNewBlogPost, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.org.couchers.notification_data.GeneralNewBlogPost.displayName = 'proto.org.couchers.notification_data.GeneralNewBlogPost';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.HostRequestCreate.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.HostRequestCreate.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.HostRequestCreate} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestCreate.toObject = function(includeInstance, msg) {
  var f, obj = {
    hostRequest: (f = msg.getHostRequest()) && requests_pb.HostRequest.toObject(includeInstance, f),
    surfer: (f = msg.getSurfer()) && api_pb.User.toObject(includeInstance, f),
    text: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.HostRequestCreate}
 */
proto.org.couchers.notification_data.HostRequestCreate.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.HostRequestCreate;
  return proto.org.couchers.notification_data.HostRequestCreate.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.HostRequestCreate} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.HostRequestCreate}
 */
proto.org.couchers.notification_data.HostRequestCreate.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new requests_pb.HostRequest;
      reader.readMessage(value,requests_pb.HostRequest.deserializeBinaryFromReader);
      msg.setHostRequest(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setSurfer(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setText(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.HostRequestCreate.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.HostRequestCreate.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.HostRequestCreate} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestCreate.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHostRequest();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      requests_pb.HostRequest.serializeBinaryToWriter
    );
  }
  f = message.getSurfer();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
  f = message.getText();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional org.couchers.api.requests.HostRequest host_request = 1;
 * @return {?proto.org.couchers.api.requests.HostRequest}
 */
proto.org.couchers.notification_data.HostRequestCreate.prototype.getHostRequest = function() {
  return /** @type{?proto.org.couchers.api.requests.HostRequest} */ (
    jspb.Message.getWrapperField(this, requests_pb.HostRequest, 1));
};


/**
 * @param {?proto.org.couchers.api.requests.HostRequest|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestCreate} returns this
*/
proto.org.couchers.notification_data.HostRequestCreate.prototype.setHostRequest = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestCreate} returns this
 */
proto.org.couchers.notification_data.HostRequestCreate.prototype.clearHostRequest = function() {
  return this.setHostRequest(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestCreate.prototype.hasHostRequest = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.core.User surfer = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.HostRequestCreate.prototype.getSurfer = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestCreate} returns this
*/
proto.org.couchers.notification_data.HostRequestCreate.prototype.setSurfer = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestCreate} returns this
 */
proto.org.couchers.notification_data.HostRequestCreate.prototype.clearSurfer = function() {
  return this.setSurfer(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestCreate.prototype.hasSurfer = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional string text = 3;
 * @return {string}
 */
proto.org.couchers.notification_data.HostRequestCreate.prototype.getText = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.HostRequestCreate} returns this
 */
proto.org.couchers.notification_data.HostRequestCreate.prototype.setText = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.HostRequestAccept.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.HostRequestAccept.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.HostRequestAccept} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestAccept.toObject = function(includeInstance, msg) {
  var f, obj = {
    hostRequest: (f = msg.getHostRequest()) && requests_pb.HostRequest.toObject(includeInstance, f),
    host: (f = msg.getHost()) && api_pb.User.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.HostRequestAccept}
 */
proto.org.couchers.notification_data.HostRequestAccept.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.HostRequestAccept;
  return proto.org.couchers.notification_data.HostRequestAccept.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.HostRequestAccept} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.HostRequestAccept}
 */
proto.org.couchers.notification_data.HostRequestAccept.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new requests_pb.HostRequest;
      reader.readMessage(value,requests_pb.HostRequest.deserializeBinaryFromReader);
      msg.setHostRequest(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setHost(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.HostRequestAccept.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.HostRequestAccept.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.HostRequestAccept} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestAccept.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHostRequest();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      requests_pb.HostRequest.serializeBinaryToWriter
    );
  }
  f = message.getHost();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.requests.HostRequest host_request = 1;
 * @return {?proto.org.couchers.api.requests.HostRequest}
 */
proto.org.couchers.notification_data.HostRequestAccept.prototype.getHostRequest = function() {
  return /** @type{?proto.org.couchers.api.requests.HostRequest} */ (
    jspb.Message.getWrapperField(this, requests_pb.HostRequest, 1));
};


/**
 * @param {?proto.org.couchers.api.requests.HostRequest|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestAccept} returns this
*/
proto.org.couchers.notification_data.HostRequestAccept.prototype.setHostRequest = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestAccept} returns this
 */
proto.org.couchers.notification_data.HostRequestAccept.prototype.clearHostRequest = function() {
  return this.setHostRequest(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestAccept.prototype.hasHostRequest = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.core.User host = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.HostRequestAccept.prototype.getHost = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestAccept} returns this
*/
proto.org.couchers.notification_data.HostRequestAccept.prototype.setHost = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestAccept} returns this
 */
proto.org.couchers.notification_data.HostRequestAccept.prototype.clearHost = function() {
  return this.setHost(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestAccept.prototype.hasHost = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.HostRequestReject.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.HostRequestReject.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.HostRequestReject} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestReject.toObject = function(includeInstance, msg) {
  var f, obj = {
    hostRequest: (f = msg.getHostRequest()) && requests_pb.HostRequest.toObject(includeInstance, f),
    host: (f = msg.getHost()) && api_pb.User.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.HostRequestReject}
 */
proto.org.couchers.notification_data.HostRequestReject.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.HostRequestReject;
  return proto.org.couchers.notification_data.HostRequestReject.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.HostRequestReject} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.HostRequestReject}
 */
proto.org.couchers.notification_data.HostRequestReject.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new requests_pb.HostRequest;
      reader.readMessage(value,requests_pb.HostRequest.deserializeBinaryFromReader);
      msg.setHostRequest(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setHost(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.HostRequestReject.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.HostRequestReject.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.HostRequestReject} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestReject.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHostRequest();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      requests_pb.HostRequest.serializeBinaryToWriter
    );
  }
  f = message.getHost();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.requests.HostRequest host_request = 1;
 * @return {?proto.org.couchers.api.requests.HostRequest}
 */
proto.org.couchers.notification_data.HostRequestReject.prototype.getHostRequest = function() {
  return /** @type{?proto.org.couchers.api.requests.HostRequest} */ (
    jspb.Message.getWrapperField(this, requests_pb.HostRequest, 1));
};


/**
 * @param {?proto.org.couchers.api.requests.HostRequest|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestReject} returns this
*/
proto.org.couchers.notification_data.HostRequestReject.prototype.setHostRequest = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestReject} returns this
 */
proto.org.couchers.notification_data.HostRequestReject.prototype.clearHostRequest = function() {
  return this.setHostRequest(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestReject.prototype.hasHostRequest = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.core.User host = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.HostRequestReject.prototype.getHost = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestReject} returns this
*/
proto.org.couchers.notification_data.HostRequestReject.prototype.setHost = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestReject} returns this
 */
proto.org.couchers.notification_data.HostRequestReject.prototype.clearHost = function() {
  return this.setHost(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestReject.prototype.hasHost = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.HostRequestConfirm.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.HostRequestConfirm.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.HostRequestConfirm} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestConfirm.toObject = function(includeInstance, msg) {
  var f, obj = {
    hostRequest: (f = msg.getHostRequest()) && requests_pb.HostRequest.toObject(includeInstance, f),
    surfer: (f = msg.getSurfer()) && api_pb.User.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.HostRequestConfirm}
 */
proto.org.couchers.notification_data.HostRequestConfirm.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.HostRequestConfirm;
  return proto.org.couchers.notification_data.HostRequestConfirm.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.HostRequestConfirm} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.HostRequestConfirm}
 */
proto.org.couchers.notification_data.HostRequestConfirm.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new requests_pb.HostRequest;
      reader.readMessage(value,requests_pb.HostRequest.deserializeBinaryFromReader);
      msg.setHostRequest(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setSurfer(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.HostRequestConfirm.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.HostRequestConfirm.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.HostRequestConfirm} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestConfirm.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHostRequest();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      requests_pb.HostRequest.serializeBinaryToWriter
    );
  }
  f = message.getSurfer();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.requests.HostRequest host_request = 1;
 * @return {?proto.org.couchers.api.requests.HostRequest}
 */
proto.org.couchers.notification_data.HostRequestConfirm.prototype.getHostRequest = function() {
  return /** @type{?proto.org.couchers.api.requests.HostRequest} */ (
    jspb.Message.getWrapperField(this, requests_pb.HostRequest, 1));
};


/**
 * @param {?proto.org.couchers.api.requests.HostRequest|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestConfirm} returns this
*/
proto.org.couchers.notification_data.HostRequestConfirm.prototype.setHostRequest = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestConfirm} returns this
 */
proto.org.couchers.notification_data.HostRequestConfirm.prototype.clearHostRequest = function() {
  return this.setHostRequest(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestConfirm.prototype.hasHostRequest = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.core.User surfer = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.HostRequestConfirm.prototype.getSurfer = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestConfirm} returns this
*/
proto.org.couchers.notification_data.HostRequestConfirm.prototype.setSurfer = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestConfirm} returns this
 */
proto.org.couchers.notification_data.HostRequestConfirm.prototype.clearSurfer = function() {
  return this.setSurfer(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestConfirm.prototype.hasSurfer = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.HostRequestCancel.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.HostRequestCancel.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.HostRequestCancel} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestCancel.toObject = function(includeInstance, msg) {
  var f, obj = {
    hostRequest: (f = msg.getHostRequest()) && requests_pb.HostRequest.toObject(includeInstance, f),
    surfer: (f = msg.getSurfer()) && api_pb.User.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.HostRequestCancel}
 */
proto.org.couchers.notification_data.HostRequestCancel.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.HostRequestCancel;
  return proto.org.couchers.notification_data.HostRequestCancel.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.HostRequestCancel} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.HostRequestCancel}
 */
proto.org.couchers.notification_data.HostRequestCancel.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new requests_pb.HostRequest;
      reader.readMessage(value,requests_pb.HostRequest.deserializeBinaryFromReader);
      msg.setHostRequest(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setSurfer(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.HostRequestCancel.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.HostRequestCancel.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.HostRequestCancel} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestCancel.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHostRequest();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      requests_pb.HostRequest.serializeBinaryToWriter
    );
  }
  f = message.getSurfer();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.requests.HostRequest host_request = 1;
 * @return {?proto.org.couchers.api.requests.HostRequest}
 */
proto.org.couchers.notification_data.HostRequestCancel.prototype.getHostRequest = function() {
  return /** @type{?proto.org.couchers.api.requests.HostRequest} */ (
    jspb.Message.getWrapperField(this, requests_pb.HostRequest, 1));
};


/**
 * @param {?proto.org.couchers.api.requests.HostRequest|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestCancel} returns this
*/
proto.org.couchers.notification_data.HostRequestCancel.prototype.setHostRequest = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestCancel} returns this
 */
proto.org.couchers.notification_data.HostRequestCancel.prototype.clearHostRequest = function() {
  return this.setHostRequest(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestCancel.prototype.hasHostRequest = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.core.User surfer = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.HostRequestCancel.prototype.getSurfer = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestCancel} returns this
*/
proto.org.couchers.notification_data.HostRequestCancel.prototype.setSurfer = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestCancel} returns this
 */
proto.org.couchers.notification_data.HostRequestCancel.prototype.clearSurfer = function() {
  return this.setSurfer(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestCancel.prototype.hasSurfer = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.HostRequestMessage.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.HostRequestMessage.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.HostRequestMessage} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestMessage.toObject = function(includeInstance, msg) {
  var f, obj = {
    hostRequest: (f = msg.getHostRequest()) && requests_pb.HostRequest.toObject(includeInstance, f),
    user: (f = msg.getUser()) && api_pb.User.toObject(includeInstance, f),
    text: jspb.Message.getFieldWithDefault(msg, 3, ""),
    amHost: jspb.Message.getBooleanFieldWithDefault(msg, 4, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.HostRequestMessage}
 */
proto.org.couchers.notification_data.HostRequestMessage.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.HostRequestMessage;
  return proto.org.couchers.notification_data.HostRequestMessage.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.HostRequestMessage} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.HostRequestMessage}
 */
proto.org.couchers.notification_data.HostRequestMessage.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new requests_pb.HostRequest;
      reader.readMessage(value,requests_pb.HostRequest.deserializeBinaryFromReader);
      msg.setHostRequest(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setUser(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setText(value);
      break;
    case 4:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setAmHost(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.HostRequestMessage.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.HostRequestMessage.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.HostRequestMessage} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestMessage.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHostRequest();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      requests_pb.HostRequest.serializeBinaryToWriter
    );
  }
  f = message.getUser();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
  f = message.getText();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getAmHost();
  if (f) {
    writer.writeBool(
      4,
      f
    );
  }
};


/**
 * optional org.couchers.api.requests.HostRequest host_request = 1;
 * @return {?proto.org.couchers.api.requests.HostRequest}
 */
proto.org.couchers.notification_data.HostRequestMessage.prototype.getHostRequest = function() {
  return /** @type{?proto.org.couchers.api.requests.HostRequest} */ (
    jspb.Message.getWrapperField(this, requests_pb.HostRequest, 1));
};


/**
 * @param {?proto.org.couchers.api.requests.HostRequest|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestMessage} returns this
*/
proto.org.couchers.notification_data.HostRequestMessage.prototype.setHostRequest = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestMessage} returns this
 */
proto.org.couchers.notification_data.HostRequestMessage.prototype.clearHostRequest = function() {
  return this.setHostRequest(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestMessage.prototype.hasHostRequest = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.core.User user = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.HostRequestMessage.prototype.getUser = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestMessage} returns this
*/
proto.org.couchers.notification_data.HostRequestMessage.prototype.setUser = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestMessage} returns this
 */
proto.org.couchers.notification_data.HostRequestMessage.prototype.clearUser = function() {
  return this.setUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestMessage.prototype.hasUser = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional string text = 3;
 * @return {string}
 */
proto.org.couchers.notification_data.HostRequestMessage.prototype.getText = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.HostRequestMessage} returns this
 */
proto.org.couchers.notification_data.HostRequestMessage.prototype.setText = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional bool am_host = 4;
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestMessage.prototype.getAmHost = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 4, false));
};


/**
 * @param {boolean} value
 * @return {!proto.org.couchers.notification_data.HostRequestMessage} returns this
 */
proto.org.couchers.notification_data.HostRequestMessage.prototype.setAmHost = function(value) {
  return jspb.Message.setProto3BooleanField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.HostRequestMissedMessages.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.HostRequestMissedMessages} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.toObject = function(includeInstance, msg) {
  var f, obj = {
    hostRequest: (f = msg.getHostRequest()) && requests_pb.HostRequest.toObject(includeInstance, f),
    user: (f = msg.getUser()) && api_pb.User.toObject(includeInstance, f),
    amHost: jspb.Message.getBooleanFieldWithDefault(msg, 3, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.HostRequestMissedMessages}
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.HostRequestMissedMessages;
  return proto.org.couchers.notification_data.HostRequestMissedMessages.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.HostRequestMissedMessages} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.HostRequestMissedMessages}
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new requests_pb.HostRequest;
      reader.readMessage(value,requests_pb.HostRequest.deserializeBinaryFromReader);
      msg.setHostRequest(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setUser(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setAmHost(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.HostRequestMissedMessages.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.HostRequestMissedMessages} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHostRequest();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      requests_pb.HostRequest.serializeBinaryToWriter
    );
  }
  f = message.getUser();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
  f = message.getAmHost();
  if (f) {
    writer.writeBool(
      3,
      f
    );
  }
};


/**
 * optional org.couchers.api.requests.HostRequest host_request = 1;
 * @return {?proto.org.couchers.api.requests.HostRequest}
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.prototype.getHostRequest = function() {
  return /** @type{?proto.org.couchers.api.requests.HostRequest} */ (
    jspb.Message.getWrapperField(this, requests_pb.HostRequest, 1));
};


/**
 * @param {?proto.org.couchers.api.requests.HostRequest|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestMissedMessages} returns this
*/
proto.org.couchers.notification_data.HostRequestMissedMessages.prototype.setHostRequest = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestMissedMessages} returns this
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.prototype.clearHostRequest = function() {
  return this.setHostRequest(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.prototype.hasHostRequest = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.core.User user = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.prototype.getUser = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.HostRequestMissedMessages} returns this
*/
proto.org.couchers.notification_data.HostRequestMissedMessages.prototype.setUser = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.HostRequestMissedMessages} returns this
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.prototype.clearUser = function() {
  return this.setUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.prototype.hasUser = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional bool am_host = 3;
 * @return {boolean}
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.prototype.getAmHost = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.org.couchers.notification_data.HostRequestMissedMessages} returns this
 */
proto.org.couchers.notification_data.HostRequestMissedMessages.prototype.setAmHost = function(value) {
  return jspb.Message.setProto3BooleanField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.BadgeAdd.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.BadgeAdd.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.BadgeAdd} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.BadgeAdd.toObject = function(includeInstance, msg) {
  var f, obj = {
    badgeId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    badgeName: jspb.Message.getFieldWithDefault(msg, 2, ""),
    badgeDescription: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.BadgeAdd}
 */
proto.org.couchers.notification_data.BadgeAdd.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.BadgeAdd;
  return proto.org.couchers.notification_data.BadgeAdd.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.BadgeAdd} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.BadgeAdd}
 */
proto.org.couchers.notification_data.BadgeAdd.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setBadgeId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setBadgeName(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setBadgeDescription(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.BadgeAdd.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.BadgeAdd.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.BadgeAdd} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.BadgeAdd.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBadgeId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getBadgeName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getBadgeDescription();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string badge_id = 1;
 * @return {string}
 */
proto.org.couchers.notification_data.BadgeAdd.prototype.getBadgeId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.BadgeAdd} returns this
 */
proto.org.couchers.notification_data.BadgeAdd.prototype.setBadgeId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string badge_name = 2;
 * @return {string}
 */
proto.org.couchers.notification_data.BadgeAdd.prototype.getBadgeName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.BadgeAdd} returns this
 */
proto.org.couchers.notification_data.BadgeAdd.prototype.setBadgeName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string badge_description = 3;
 * @return {string}
 */
proto.org.couchers.notification_data.BadgeAdd.prototype.getBadgeDescription = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.BadgeAdd} returns this
 */
proto.org.couchers.notification_data.BadgeAdd.prototype.setBadgeDescription = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.BadgeRemove.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.BadgeRemove.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.BadgeRemove} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.BadgeRemove.toObject = function(includeInstance, msg) {
  var f, obj = {
    badgeId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    badgeName: jspb.Message.getFieldWithDefault(msg, 2, ""),
    badgeDescription: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.BadgeRemove}
 */
proto.org.couchers.notification_data.BadgeRemove.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.BadgeRemove;
  return proto.org.couchers.notification_data.BadgeRemove.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.BadgeRemove} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.BadgeRemove}
 */
proto.org.couchers.notification_data.BadgeRemove.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setBadgeId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setBadgeName(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setBadgeDescription(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.BadgeRemove.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.BadgeRemove.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.BadgeRemove} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.BadgeRemove.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBadgeId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getBadgeName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getBadgeDescription();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string badge_id = 1;
 * @return {string}
 */
proto.org.couchers.notification_data.BadgeRemove.prototype.getBadgeId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.BadgeRemove} returns this
 */
proto.org.couchers.notification_data.BadgeRemove.prototype.setBadgeId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string badge_name = 2;
 * @return {string}
 */
proto.org.couchers.notification_data.BadgeRemove.prototype.getBadgeName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.BadgeRemove} returns this
 */
proto.org.couchers.notification_data.BadgeRemove.prototype.setBadgeName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string badge_description = 3;
 * @return {string}
 */
proto.org.couchers.notification_data.BadgeRemove.prototype.getBadgeDescription = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.BadgeRemove} returns this
 */
proto.org.couchers.notification_data.BadgeRemove.prototype.setBadgeDescription = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.PhoneNumberChange.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.PhoneNumberChange.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.PhoneNumberChange} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.PhoneNumberChange.toObject = function(includeInstance, msg) {
  var f, obj = {
    phone: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.PhoneNumberChange}
 */
proto.org.couchers.notification_data.PhoneNumberChange.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.PhoneNumberChange;
  return proto.org.couchers.notification_data.PhoneNumberChange.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.PhoneNumberChange} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.PhoneNumberChange}
 */
proto.org.couchers.notification_data.PhoneNumberChange.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPhone(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.PhoneNumberChange.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.PhoneNumberChange.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.PhoneNumberChange} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.PhoneNumberChange.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPhone();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string phone = 1;
 * @return {string}
 */
proto.org.couchers.notification_data.PhoneNumberChange.prototype.getPhone = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.PhoneNumberChange} returns this
 */
proto.org.couchers.notification_data.PhoneNumberChange.prototype.setPhone = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.PhoneNumberVerify.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.PhoneNumberVerify.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.PhoneNumberVerify} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.PhoneNumberVerify.toObject = function(includeInstance, msg) {
  var f, obj = {
    phone: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.PhoneNumberVerify}
 */
proto.org.couchers.notification_data.PhoneNumberVerify.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.PhoneNumberVerify;
  return proto.org.couchers.notification_data.PhoneNumberVerify.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.PhoneNumberVerify} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.PhoneNumberVerify}
 */
proto.org.couchers.notification_data.PhoneNumberVerify.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPhone(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.PhoneNumberVerify.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.PhoneNumberVerify.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.PhoneNumberVerify} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.PhoneNumberVerify.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPhone();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string phone = 1;
 * @return {string}
 */
proto.org.couchers.notification_data.PhoneNumberVerify.prototype.getPhone = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.PhoneNumberVerify} returns this
 */
proto.org.couchers.notification_data.PhoneNumberVerify.prototype.setPhone = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.GenderChange.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.GenderChange.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.GenderChange} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.GenderChange.toObject = function(includeInstance, msg) {
  var f, obj = {
    gender: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.GenderChange}
 */
proto.org.couchers.notification_data.GenderChange.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.GenderChange;
  return proto.org.couchers.notification_data.GenderChange.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.GenderChange} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.GenderChange}
 */
proto.org.couchers.notification_data.GenderChange.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setGender(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.GenderChange.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.GenderChange.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.GenderChange} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.GenderChange.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getGender();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string gender = 1;
 * @return {string}
 */
proto.org.couchers.notification_data.GenderChange.prototype.getGender = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.GenderChange} returns this
 */
proto.org.couchers.notification_data.GenderChange.prototype.setGender = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.BirthdateChange.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.BirthdateChange.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.BirthdateChange} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.BirthdateChange.toObject = function(includeInstance, msg) {
  var f, obj = {
    birthdate: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.BirthdateChange}
 */
proto.org.couchers.notification_data.BirthdateChange.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.BirthdateChange;
  return proto.org.couchers.notification_data.BirthdateChange.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.BirthdateChange} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.BirthdateChange}
 */
proto.org.couchers.notification_data.BirthdateChange.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setBirthdate(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.BirthdateChange.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.BirthdateChange.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.BirthdateChange} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.BirthdateChange.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBirthdate();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string birthdate = 2;
 * @return {string}
 */
proto.org.couchers.notification_data.BirthdateChange.prototype.getBirthdate = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.BirthdateChange} returns this
 */
proto.org.couchers.notification_data.BirthdateChange.prototype.setBirthdate = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.FriendRequestCreate.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.FriendRequestCreate.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.FriendRequestCreate} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.FriendRequestCreate.toObject = function(includeInstance, msg) {
  var f, obj = {
    otherUser: (f = msg.getOtherUser()) && api_pb.User.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.FriendRequestCreate}
 */
proto.org.couchers.notification_data.FriendRequestCreate.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.FriendRequestCreate;
  return proto.org.couchers.notification_data.FriendRequestCreate.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.FriendRequestCreate} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.FriendRequestCreate}
 */
proto.org.couchers.notification_data.FriendRequestCreate.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setOtherUser(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.FriendRequestCreate.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.FriendRequestCreate.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.FriendRequestCreate} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.FriendRequestCreate.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOtherUser();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.core.User other_user = 1;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.FriendRequestCreate.prototype.getOtherUser = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 1));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.FriendRequestCreate} returns this
*/
proto.org.couchers.notification_data.FriendRequestCreate.prototype.setOtherUser = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.FriendRequestCreate} returns this
 */
proto.org.couchers.notification_data.FriendRequestCreate.prototype.clearOtherUser = function() {
  return this.setOtherUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.FriendRequestCreate.prototype.hasOtherUser = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.FriendRequestAccept.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.FriendRequestAccept.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.FriendRequestAccept} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.FriendRequestAccept.toObject = function(includeInstance, msg) {
  var f, obj = {
    otherUser: (f = msg.getOtherUser()) && api_pb.User.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.FriendRequestAccept}
 */
proto.org.couchers.notification_data.FriendRequestAccept.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.FriendRequestAccept;
  return proto.org.couchers.notification_data.FriendRequestAccept.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.FriendRequestAccept} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.FriendRequestAccept}
 */
proto.org.couchers.notification_data.FriendRequestAccept.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setOtherUser(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.FriendRequestAccept.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.FriendRequestAccept.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.FriendRequestAccept} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.FriendRequestAccept.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOtherUser();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.core.User other_user = 1;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.FriendRequestAccept.prototype.getOtherUser = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 1));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.FriendRequestAccept} returns this
*/
proto.org.couchers.notification_data.FriendRequestAccept.prototype.setOtherUser = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.FriendRequestAccept} returns this
 */
proto.org.couchers.notification_data.FriendRequestAccept.prototype.clearOtherUser = function() {
  return this.setOtherUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.FriendRequestAccept.prototype.hasOtherUser = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.EmailAddressChange.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.EmailAddressChange.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.EmailAddressChange} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EmailAddressChange.toObject = function(includeInstance, msg) {
  var f, obj = {
    newEmail: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.EmailAddressChange}
 */
proto.org.couchers.notification_data.EmailAddressChange.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.EmailAddressChange;
  return proto.org.couchers.notification_data.EmailAddressChange.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.EmailAddressChange} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.EmailAddressChange}
 */
proto.org.couchers.notification_data.EmailAddressChange.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setNewEmail(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.EmailAddressChange.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.EmailAddressChange.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.EmailAddressChange} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EmailAddressChange.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNewEmail();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string new_email = 1;
 * @return {string}
 */
proto.org.couchers.notification_data.EmailAddressChange.prototype.getNewEmail = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.EmailAddressChange} returns this
 */
proto.org.couchers.notification_data.EmailAddressChange.prototype.setNewEmail = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.DonationReceived.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.DonationReceived.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.DonationReceived} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.DonationReceived.toObject = function(includeInstance, msg) {
  var f, obj = {
    amount: jspb.Message.getFieldWithDefault(msg, 1, 0),
    receiptUrl: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.DonationReceived}
 */
proto.org.couchers.notification_data.DonationReceived.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.DonationReceived;
  return proto.org.couchers.notification_data.DonationReceived.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.DonationReceived} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.DonationReceived}
 */
proto.org.couchers.notification_data.DonationReceived.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setAmount(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setReceiptUrl(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.DonationReceived.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.DonationReceived.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.DonationReceived} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.DonationReceived.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAmount();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getReceiptUrl();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional int64 amount = 1;
 * @return {number}
 */
proto.org.couchers.notification_data.DonationReceived.prototype.getAmount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.org.couchers.notification_data.DonationReceived} returns this
 */
proto.org.couchers.notification_data.DonationReceived.prototype.setAmount = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string receipt_url = 2;
 * @return {string}
 */
proto.org.couchers.notification_data.DonationReceived.prototype.getReceiptUrl = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.DonationReceived} returns this
 */
proto.org.couchers.notification_data.DonationReceived.prototype.setReceiptUrl = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.PasswordResetStart.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.PasswordResetStart.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.PasswordResetStart} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.PasswordResetStart.toObject = function(includeInstance, msg) {
  var f, obj = {
    passwordResetToken: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.PasswordResetStart}
 */
proto.org.couchers.notification_data.PasswordResetStart.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.PasswordResetStart;
  return proto.org.couchers.notification_data.PasswordResetStart.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.PasswordResetStart} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.PasswordResetStart}
 */
proto.org.couchers.notification_data.PasswordResetStart.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPasswordResetToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.PasswordResetStart.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.PasswordResetStart.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.PasswordResetStart} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.PasswordResetStart.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPasswordResetToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string password_reset_token = 1;
 * @return {string}
 */
proto.org.couchers.notification_data.PasswordResetStart.prototype.getPasswordResetToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.PasswordResetStart} returns this
 */
proto.org.couchers.notification_data.PasswordResetStart.prototype.setPasswordResetToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.AccountDeletionStart.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.AccountDeletionStart.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.AccountDeletionStart} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.AccountDeletionStart.toObject = function(includeInstance, msg) {
  var f, obj = {
    deletionToken: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.AccountDeletionStart}
 */
proto.org.couchers.notification_data.AccountDeletionStart.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.AccountDeletionStart;
  return proto.org.couchers.notification_data.AccountDeletionStart.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.AccountDeletionStart} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.AccountDeletionStart}
 */
proto.org.couchers.notification_data.AccountDeletionStart.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setDeletionToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.AccountDeletionStart.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.AccountDeletionStart.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.AccountDeletionStart} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.AccountDeletionStart.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDeletionToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string deletion_token = 1;
 * @return {string}
 */
proto.org.couchers.notification_data.AccountDeletionStart.prototype.getDeletionToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.AccountDeletionStart} returns this
 */
proto.org.couchers.notification_data.AccountDeletionStart.prototype.setDeletionToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.AccountDeletionComplete.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.AccountDeletionComplete.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.AccountDeletionComplete} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.AccountDeletionComplete.toObject = function(includeInstance, msg) {
  var f, obj = {
    undeleteToken: jspb.Message.getFieldWithDefault(msg, 1, ""),
    undeleteDays: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.AccountDeletionComplete}
 */
proto.org.couchers.notification_data.AccountDeletionComplete.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.AccountDeletionComplete;
  return proto.org.couchers.notification_data.AccountDeletionComplete.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.AccountDeletionComplete} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.AccountDeletionComplete}
 */
proto.org.couchers.notification_data.AccountDeletionComplete.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUndeleteToken(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setUndeleteDays(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.AccountDeletionComplete.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.AccountDeletionComplete.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.AccountDeletionComplete} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.AccountDeletionComplete.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUndeleteToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getUndeleteDays();
  if (f !== 0) {
    writer.writeUint32(
      2,
      f
    );
  }
};


/**
 * optional string undelete_token = 1;
 * @return {string}
 */
proto.org.couchers.notification_data.AccountDeletionComplete.prototype.getUndeleteToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.AccountDeletionComplete} returns this
 */
proto.org.couchers.notification_data.AccountDeletionComplete.prototype.setUndeleteToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint32 undelete_days = 2;
 * @return {number}
 */
proto.org.couchers.notification_data.AccountDeletionComplete.prototype.getUndeleteDays = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.org.couchers.notification_data.AccountDeletionComplete} returns this
 */
proto.org.couchers.notification_data.AccountDeletionComplete.prototype.setUndeleteDays = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.ApiKeyCreate.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.ApiKeyCreate.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.ApiKeyCreate} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ApiKeyCreate.toObject = function(includeInstance, msg) {
  var f, obj = {
    apiKey: jspb.Message.getFieldWithDefault(msg, 1, ""),
    expiry: (f = msg.getExpiry()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.ApiKeyCreate}
 */
proto.org.couchers.notification_data.ApiKeyCreate.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.ApiKeyCreate;
  return proto.org.couchers.notification_data.ApiKeyCreate.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.ApiKeyCreate} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.ApiKeyCreate}
 */
proto.org.couchers.notification_data.ApiKeyCreate.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setApiKey(value);
      break;
    case 2:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setExpiry(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.ApiKeyCreate.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.ApiKeyCreate.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.ApiKeyCreate} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ApiKeyCreate.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getApiKey();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getExpiry();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string api_key = 1;
 * @return {string}
 */
proto.org.couchers.notification_data.ApiKeyCreate.prototype.getApiKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.ApiKeyCreate} returns this
 */
proto.org.couchers.notification_data.ApiKeyCreate.prototype.setApiKey = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional google.protobuf.Timestamp expiry = 2;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.org.couchers.notification_data.ApiKeyCreate.prototype.getExpiry = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 2));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.org.couchers.notification_data.ApiKeyCreate} returns this
*/
proto.org.couchers.notification_data.ApiKeyCreate.prototype.setExpiry = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.ApiKeyCreate} returns this
 */
proto.org.couchers.notification_data.ApiKeyCreate.prototype.clearExpiry = function() {
  return this.setExpiry(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.ApiKeyCreate.prototype.hasExpiry = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.EventInviteOrganizer.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.EventInviteOrganizer.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.EventInviteOrganizer} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EventInviteOrganizer.toObject = function(includeInstance, msg) {
  var f, obj = {
    event: (f = msg.getEvent()) && events_pb.Event.toObject(includeInstance, f),
    invitingUser: (f = msg.getInvitingUser()) && api_pb.User.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.EventInviteOrganizer}
 */
proto.org.couchers.notification_data.EventInviteOrganizer.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.EventInviteOrganizer;
  return proto.org.couchers.notification_data.EventInviteOrganizer.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.EventInviteOrganizer} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.EventInviteOrganizer}
 */
proto.org.couchers.notification_data.EventInviteOrganizer.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new events_pb.Event;
      reader.readMessage(value,events_pb.Event.deserializeBinaryFromReader);
      msg.setEvent(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setInvitingUser(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.EventInviteOrganizer.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.EventInviteOrganizer.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.EventInviteOrganizer} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EventInviteOrganizer.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEvent();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      events_pb.Event.serializeBinaryToWriter
    );
  }
  f = message.getInvitingUser();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.events.Event event = 1;
 * @return {?proto.org.couchers.api.events.Event}
 */
proto.org.couchers.notification_data.EventInviteOrganizer.prototype.getEvent = function() {
  return /** @type{?proto.org.couchers.api.events.Event} */ (
    jspb.Message.getWrapperField(this, events_pb.Event, 1));
};


/**
 * @param {?proto.org.couchers.api.events.Event|undefined} value
 * @return {!proto.org.couchers.notification_data.EventInviteOrganizer} returns this
*/
proto.org.couchers.notification_data.EventInviteOrganizer.prototype.setEvent = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventInviteOrganizer} returns this
 */
proto.org.couchers.notification_data.EventInviteOrganizer.prototype.clearEvent = function() {
  return this.setEvent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventInviteOrganizer.prototype.hasEvent = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.core.User inviting_user = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.EventInviteOrganizer.prototype.getInvitingUser = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.EventInviteOrganizer} returns this
*/
proto.org.couchers.notification_data.EventInviteOrganizer.prototype.setInvitingUser = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventInviteOrganizer} returns this
 */
proto.org.couchers.notification_data.EventInviteOrganizer.prototype.clearInvitingUser = function() {
  return this.setInvitingUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventInviteOrganizer.prototype.hasInvitingUser = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.org.couchers.notification_data.EventCreate.oneofGroups_ = [[3,4]];

/**
 * @enum {number}
 */
proto.org.couchers.notification_data.EventCreate.NotificationReasonCase = {
  NOTIFICATION_REASON_NOT_SET: 0,
  NEARBY: 3,
  IN_COMMUNITY: 4
};

/**
 * @return {proto.org.couchers.notification_data.EventCreate.NotificationReasonCase}
 */
proto.org.couchers.notification_data.EventCreate.prototype.getNotificationReasonCase = function() {
  return /** @type {proto.org.couchers.notification_data.EventCreate.NotificationReasonCase} */(jspb.Message.computeOneofCase(this, proto.org.couchers.notification_data.EventCreate.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.EventCreate.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.EventCreate.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.EventCreate} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EventCreate.toObject = function(includeInstance, msg) {
  var f, obj = {
    event: (f = msg.getEvent()) && events_pb.Event.toObject(includeInstance, f),
    invitingUser: (f = msg.getInvitingUser()) && api_pb.User.toObject(includeInstance, f),
    nearby: jspb.Message.getBooleanFieldWithDefault(msg, 3, false),
    inCommunity: (f = msg.getInCommunity()) && communities_pb.Community.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.EventCreate}
 */
proto.org.couchers.notification_data.EventCreate.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.EventCreate;
  return proto.org.couchers.notification_data.EventCreate.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.EventCreate} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.EventCreate}
 */
proto.org.couchers.notification_data.EventCreate.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new events_pb.Event;
      reader.readMessage(value,events_pb.Event.deserializeBinaryFromReader);
      msg.setEvent(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setInvitingUser(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setNearby(value);
      break;
    case 4:
      var value = new communities_pb.Community;
      reader.readMessage(value,communities_pb.Community.deserializeBinaryFromReader);
      msg.setInCommunity(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.EventCreate.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.EventCreate.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.EventCreate} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EventCreate.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEvent();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      events_pb.Event.serializeBinaryToWriter
    );
  }
  f = message.getInvitingUser();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
  f = /** @type {boolean} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeBool(
      3,
      f
    );
  }
  f = message.getInCommunity();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      communities_pb.Community.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.events.Event event = 1;
 * @return {?proto.org.couchers.api.events.Event}
 */
proto.org.couchers.notification_data.EventCreate.prototype.getEvent = function() {
  return /** @type{?proto.org.couchers.api.events.Event} */ (
    jspb.Message.getWrapperField(this, events_pb.Event, 1));
};


/**
 * @param {?proto.org.couchers.api.events.Event|undefined} value
 * @return {!proto.org.couchers.notification_data.EventCreate} returns this
*/
proto.org.couchers.notification_data.EventCreate.prototype.setEvent = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventCreate} returns this
 */
proto.org.couchers.notification_data.EventCreate.prototype.clearEvent = function() {
  return this.setEvent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventCreate.prototype.hasEvent = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.core.User inviting_user = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.EventCreate.prototype.getInvitingUser = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.EventCreate} returns this
*/
proto.org.couchers.notification_data.EventCreate.prototype.setInvitingUser = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventCreate} returns this
 */
proto.org.couchers.notification_data.EventCreate.prototype.clearInvitingUser = function() {
  return this.setInvitingUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventCreate.prototype.hasInvitingUser = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional bool nearby = 3;
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventCreate.prototype.getNearby = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.org.couchers.notification_data.EventCreate} returns this
 */
proto.org.couchers.notification_data.EventCreate.prototype.setNearby = function(value) {
  return jspb.Message.setOneofField(this, 3, proto.org.couchers.notification_data.EventCreate.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventCreate} returns this
 */
proto.org.couchers.notification_data.EventCreate.prototype.clearNearby = function() {
  return jspb.Message.setOneofField(this, 3, proto.org.couchers.notification_data.EventCreate.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventCreate.prototype.hasNearby = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional org.couchers.api.communities.Community in_community = 4;
 * @return {?proto.org.couchers.api.communities.Community}
 */
proto.org.couchers.notification_data.EventCreate.prototype.getInCommunity = function() {
  return /** @type{?proto.org.couchers.api.communities.Community} */ (
    jspb.Message.getWrapperField(this, communities_pb.Community, 4));
};


/**
 * @param {?proto.org.couchers.api.communities.Community|undefined} value
 * @return {!proto.org.couchers.notification_data.EventCreate} returns this
*/
proto.org.couchers.notification_data.EventCreate.prototype.setInCommunity = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.org.couchers.notification_data.EventCreate.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventCreate} returns this
 */
proto.org.couchers.notification_data.EventCreate.prototype.clearInCommunity = function() {
  return this.setInCommunity(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventCreate.prototype.hasInCommunity = function() {
  return jspb.Message.getField(this, 4) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.org.couchers.notification_data.EventUpdate.repeatedFields_ = [3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.EventUpdate.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.EventUpdate.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.EventUpdate} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EventUpdate.toObject = function(includeInstance, msg) {
  var f, obj = {
    event: (f = msg.getEvent()) && events_pb.Event.toObject(includeInstance, f),
    updatingUser: (f = msg.getUpdatingUser()) && api_pb.User.toObject(includeInstance, f),
    updatedItemsList: (f = jspb.Message.getRepeatedField(msg, 3)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.EventUpdate}
 */
proto.org.couchers.notification_data.EventUpdate.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.EventUpdate;
  return proto.org.couchers.notification_data.EventUpdate.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.EventUpdate} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.EventUpdate}
 */
proto.org.couchers.notification_data.EventUpdate.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new events_pb.Event;
      reader.readMessage(value,events_pb.Event.deserializeBinaryFromReader);
      msg.setEvent(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setUpdatingUser(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.addUpdatedItems(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.EventUpdate.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.EventUpdate.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.EventUpdate} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EventUpdate.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEvent();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      events_pb.Event.serializeBinaryToWriter
    );
  }
  f = message.getUpdatingUser();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
  f = message.getUpdatedItemsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      3,
      f
    );
  }
};


/**
 * optional org.couchers.api.events.Event event = 1;
 * @return {?proto.org.couchers.api.events.Event}
 */
proto.org.couchers.notification_data.EventUpdate.prototype.getEvent = function() {
  return /** @type{?proto.org.couchers.api.events.Event} */ (
    jspb.Message.getWrapperField(this, events_pb.Event, 1));
};


/**
 * @param {?proto.org.couchers.api.events.Event|undefined} value
 * @return {!proto.org.couchers.notification_data.EventUpdate} returns this
*/
proto.org.couchers.notification_data.EventUpdate.prototype.setEvent = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventUpdate} returns this
 */
proto.org.couchers.notification_data.EventUpdate.prototype.clearEvent = function() {
  return this.setEvent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventUpdate.prototype.hasEvent = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.core.User updating_user = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.EventUpdate.prototype.getUpdatingUser = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.EventUpdate} returns this
*/
proto.org.couchers.notification_data.EventUpdate.prototype.setUpdatingUser = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventUpdate} returns this
 */
proto.org.couchers.notification_data.EventUpdate.prototype.clearUpdatingUser = function() {
  return this.setUpdatingUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventUpdate.prototype.hasUpdatingUser = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * repeated string updated_items = 3;
 * @return {!Array<string>}
 */
proto.org.couchers.notification_data.EventUpdate.prototype.getUpdatedItemsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 3));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.org.couchers.notification_data.EventUpdate} returns this
 */
proto.org.couchers.notification_data.EventUpdate.prototype.setUpdatedItemsList = function(value) {
  return jspb.Message.setField(this, 3, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.org.couchers.notification_data.EventUpdate} returns this
 */
proto.org.couchers.notification_data.EventUpdate.prototype.addUpdatedItems = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 3, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.org.couchers.notification_data.EventUpdate} returns this
 */
proto.org.couchers.notification_data.EventUpdate.prototype.clearUpdatedItemsList = function() {
  return this.setUpdatedItemsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.EventCancel.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.EventCancel.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.EventCancel} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EventCancel.toObject = function(includeInstance, msg) {
  var f, obj = {
    event: (f = msg.getEvent()) && events_pb.Event.toObject(includeInstance, f),
    cancellingUser: (f = msg.getCancellingUser()) && api_pb.User.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.EventCancel}
 */
proto.org.couchers.notification_data.EventCancel.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.EventCancel;
  return proto.org.couchers.notification_data.EventCancel.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.EventCancel} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.EventCancel}
 */
proto.org.couchers.notification_data.EventCancel.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new events_pb.Event;
      reader.readMessage(value,events_pb.Event.deserializeBinaryFromReader);
      msg.setEvent(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setCancellingUser(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.EventCancel.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.EventCancel.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.EventCancel} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EventCancel.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEvent();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      events_pb.Event.serializeBinaryToWriter
    );
  }
  f = message.getCancellingUser();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.events.Event event = 1;
 * @return {?proto.org.couchers.api.events.Event}
 */
proto.org.couchers.notification_data.EventCancel.prototype.getEvent = function() {
  return /** @type{?proto.org.couchers.api.events.Event} */ (
    jspb.Message.getWrapperField(this, events_pb.Event, 1));
};


/**
 * @param {?proto.org.couchers.api.events.Event|undefined} value
 * @return {!proto.org.couchers.notification_data.EventCancel} returns this
*/
proto.org.couchers.notification_data.EventCancel.prototype.setEvent = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventCancel} returns this
 */
proto.org.couchers.notification_data.EventCancel.prototype.clearEvent = function() {
  return this.setEvent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventCancel.prototype.hasEvent = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.core.User cancelling_user = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.EventCancel.prototype.getCancellingUser = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.EventCancel} returns this
*/
proto.org.couchers.notification_data.EventCancel.prototype.setCancellingUser = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventCancel} returns this
 */
proto.org.couchers.notification_data.EventCancel.prototype.clearCancellingUser = function() {
  return this.setCancellingUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventCancel.prototype.hasCancellingUser = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.EventDelete.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.EventDelete.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.EventDelete} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EventDelete.toObject = function(includeInstance, msg) {
  var f, obj = {
    event: (f = msg.getEvent()) && events_pb.Event.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.EventDelete}
 */
proto.org.couchers.notification_data.EventDelete.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.EventDelete;
  return proto.org.couchers.notification_data.EventDelete.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.EventDelete} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.EventDelete}
 */
proto.org.couchers.notification_data.EventDelete.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new events_pb.Event;
      reader.readMessage(value,events_pb.Event.deserializeBinaryFromReader);
      msg.setEvent(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.EventDelete.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.EventDelete.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.EventDelete} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EventDelete.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEvent();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      events_pb.Event.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.events.Event event = 1;
 * @return {?proto.org.couchers.api.events.Event}
 */
proto.org.couchers.notification_data.EventDelete.prototype.getEvent = function() {
  return /** @type{?proto.org.couchers.api.events.Event} */ (
    jspb.Message.getWrapperField(this, events_pb.Event, 1));
};


/**
 * @param {?proto.org.couchers.api.events.Event|undefined} value
 * @return {!proto.org.couchers.notification_data.EventDelete} returns this
*/
proto.org.couchers.notification_data.EventDelete.prototype.setEvent = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventDelete} returns this
 */
proto.org.couchers.notification_data.EventDelete.prototype.clearEvent = function() {
  return this.setEvent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventDelete.prototype.hasEvent = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.ChatMessage.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.ChatMessage.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.ChatMessage} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ChatMessage.toObject = function(includeInstance, msg) {
  var f, obj = {
    author: (f = msg.getAuthor()) && api_pb.User.toObject(includeInstance, f),
    message: jspb.Message.getFieldWithDefault(msg, 2, ""),
    text: jspb.Message.getFieldWithDefault(msg, 3, ""),
    groupChatId: jspb.Message.getFieldWithDefault(msg, 4, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.ChatMessage}
 */
proto.org.couchers.notification_data.ChatMessage.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.ChatMessage;
  return proto.org.couchers.notification_data.ChatMessage.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.ChatMessage} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.ChatMessage}
 */
proto.org.couchers.notification_data.ChatMessage.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setAuthor(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setMessage(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setText(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setGroupChatId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.ChatMessage.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.ChatMessage.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.ChatMessage} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ChatMessage.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAuthor();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
  f = message.getMessage();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getText();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getGroupChatId();
  if (f !== 0) {
    writer.writeUint64(
      4,
      f
    );
  }
};


/**
 * optional org.couchers.api.core.User author = 1;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.ChatMessage.prototype.getAuthor = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 1));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.ChatMessage} returns this
*/
proto.org.couchers.notification_data.ChatMessage.prototype.setAuthor = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.ChatMessage} returns this
 */
proto.org.couchers.notification_data.ChatMessage.prototype.clearAuthor = function() {
  return this.setAuthor(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.ChatMessage.prototype.hasAuthor = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string message = 2;
 * @return {string}
 */
proto.org.couchers.notification_data.ChatMessage.prototype.getMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.ChatMessage} returns this
 */
proto.org.couchers.notification_data.ChatMessage.prototype.setMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string text = 3;
 * @return {string}
 */
proto.org.couchers.notification_data.ChatMessage.prototype.getText = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.ChatMessage} returns this
 */
proto.org.couchers.notification_data.ChatMessage.prototype.setText = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional uint64 group_chat_id = 4;
 * @return {number}
 */
proto.org.couchers.notification_data.ChatMessage.prototype.getGroupChatId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.org.couchers.notification_data.ChatMessage} returns this
 */
proto.org.couchers.notification_data.ChatMessage.prototype.setGroupChatId = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.org.couchers.notification_data.ChatMissedMessages.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.ChatMissedMessages.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.ChatMissedMessages.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.ChatMissedMessages} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ChatMissedMessages.toObject = function(includeInstance, msg) {
  var f, obj = {
    messagesList: jspb.Message.toObjectList(msg.getMessagesList(),
    proto.org.couchers.notification_data.ChatMessage.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.ChatMissedMessages}
 */
proto.org.couchers.notification_data.ChatMissedMessages.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.ChatMissedMessages;
  return proto.org.couchers.notification_data.ChatMissedMessages.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.ChatMissedMessages} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.ChatMissedMessages}
 */
proto.org.couchers.notification_data.ChatMissedMessages.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.org.couchers.notification_data.ChatMessage;
      reader.readMessage(value,proto.org.couchers.notification_data.ChatMessage.deserializeBinaryFromReader);
      msg.addMessages(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.ChatMissedMessages.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.ChatMissedMessages.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.ChatMissedMessages} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ChatMissedMessages.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMessagesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.org.couchers.notification_data.ChatMessage.serializeBinaryToWriter
    );
  }
};


/**
 * repeated ChatMessage messages = 1;
 * @return {!Array<!proto.org.couchers.notification_data.ChatMessage>}
 */
proto.org.couchers.notification_data.ChatMissedMessages.prototype.getMessagesList = function() {
  return /** @type{!Array<!proto.org.couchers.notification_data.ChatMessage>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.org.couchers.notification_data.ChatMessage, 1));
};


/**
 * @param {!Array<!proto.org.couchers.notification_data.ChatMessage>} value
 * @return {!proto.org.couchers.notification_data.ChatMissedMessages} returns this
*/
proto.org.couchers.notification_data.ChatMissedMessages.prototype.setMessagesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.org.couchers.notification_data.ChatMessage=} opt_value
 * @param {number=} opt_index
 * @return {!proto.org.couchers.notification_data.ChatMessage}
 */
proto.org.couchers.notification_data.ChatMissedMessages.prototype.addMessages = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.org.couchers.notification_data.ChatMessage, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.org.couchers.notification_data.ChatMissedMessages} returns this
 */
proto.org.couchers.notification_data.ChatMissedMessages.prototype.clearMessagesList = function() {
  return this.setMessagesList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.ReferenceReceiveFriend.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.ReferenceReceiveFriend.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.ReferenceReceiveFriend} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ReferenceReceiveFriend.toObject = function(includeInstance, msg) {
  var f, obj = {
    fromUser: (f = msg.getFromUser()) && api_pb.User.toObject(includeInstance, f),
    text: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.ReferenceReceiveFriend}
 */
proto.org.couchers.notification_data.ReferenceReceiveFriend.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.ReferenceReceiveFriend;
  return proto.org.couchers.notification_data.ReferenceReceiveFriend.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.ReferenceReceiveFriend} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.ReferenceReceiveFriend}
 */
proto.org.couchers.notification_data.ReferenceReceiveFriend.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setFromUser(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setText(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.ReferenceReceiveFriend.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.ReferenceReceiveFriend.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.ReferenceReceiveFriend} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ReferenceReceiveFriend.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getFromUser();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
  f = message.getText();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional org.couchers.api.core.User from_user = 1;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.ReferenceReceiveFriend.prototype.getFromUser = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 1));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.ReferenceReceiveFriend} returns this
*/
proto.org.couchers.notification_data.ReferenceReceiveFriend.prototype.setFromUser = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.ReferenceReceiveFriend} returns this
 */
proto.org.couchers.notification_data.ReferenceReceiveFriend.prototype.clearFromUser = function() {
  return this.setFromUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.ReferenceReceiveFriend.prototype.hasFromUser = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string text = 2;
 * @return {string}
 */
proto.org.couchers.notification_data.ReferenceReceiveFriend.prototype.getText = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.ReferenceReceiveFriend} returns this
 */
proto.org.couchers.notification_data.ReferenceReceiveFriend.prototype.setText = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.ReferenceReceiveHostRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.ReferenceReceiveHostRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    hostRequestId: jspb.Message.getFieldWithDefault(msg, 1, 0),
    fromUser: (f = msg.getFromUser()) && api_pb.User.toObject(includeInstance, f),
    text: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.ReferenceReceiveHostRequest}
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.ReferenceReceiveHostRequest;
  return proto.org.couchers.notification_data.ReferenceReceiveHostRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.ReferenceReceiveHostRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.ReferenceReceiveHostRequest}
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setHostRequestId(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setFromUser(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setText(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.ReferenceReceiveHostRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.ReferenceReceiveHostRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHostRequestId();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getFromUser();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
  f = message.getText();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional int64 host_request_id = 1;
 * @return {number}
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.prototype.getHostRequestId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.org.couchers.notification_data.ReferenceReceiveHostRequest} returns this
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.prototype.setHostRequestId = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional org.couchers.api.core.User from_user = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.prototype.getFromUser = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.ReferenceReceiveHostRequest} returns this
*/
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.prototype.setFromUser = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.ReferenceReceiveHostRequest} returns this
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.prototype.clearFromUser = function() {
  return this.setFromUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.prototype.hasFromUser = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional string text = 3;
 * @return {string}
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.prototype.getText = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.ReferenceReceiveHostRequest} returns this
 */
proto.org.couchers.notification_data.ReferenceReceiveHostRequest.prototype.setText = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.ReferenceReminder.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.ReferenceReminder.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.ReferenceReminder} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ReferenceReminder.toObject = function(includeInstance, msg) {
  var f, obj = {
    hostRequestId: jspb.Message.getFieldWithDefault(msg, 1, 0),
    otherUser: (f = msg.getOtherUser()) && api_pb.User.toObject(includeInstance, f),
    daysLeft: jspb.Message.getFieldWithDefault(msg, 3, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.ReferenceReminder}
 */
proto.org.couchers.notification_data.ReferenceReminder.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.ReferenceReminder;
  return proto.org.couchers.notification_data.ReferenceReminder.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.ReferenceReminder} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.ReferenceReminder}
 */
proto.org.couchers.notification_data.ReferenceReminder.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setHostRequestId(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setOtherUser(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setDaysLeft(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.ReferenceReminder.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.ReferenceReminder.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.ReferenceReminder} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ReferenceReminder.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHostRequestId();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getOtherUser();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
  f = message.getDaysLeft();
  if (f !== 0) {
    writer.writeUint32(
      3,
      f
    );
  }
};


/**
 * optional int64 host_request_id = 1;
 * @return {number}
 */
proto.org.couchers.notification_data.ReferenceReminder.prototype.getHostRequestId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.org.couchers.notification_data.ReferenceReminder} returns this
 */
proto.org.couchers.notification_data.ReferenceReminder.prototype.setHostRequestId = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional org.couchers.api.core.User other_user = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.ReferenceReminder.prototype.getOtherUser = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.ReferenceReminder} returns this
*/
proto.org.couchers.notification_data.ReferenceReminder.prototype.setOtherUser = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.ReferenceReminder} returns this
 */
proto.org.couchers.notification_data.ReferenceReminder.prototype.clearOtherUser = function() {
  return this.setOtherUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.ReferenceReminder.prototype.hasOtherUser = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional uint32 days_left = 3;
 * @return {number}
 */
proto.org.couchers.notification_data.ReferenceReminder.prototype.getDaysLeft = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.org.couchers.notification_data.ReferenceReminder} returns this
 */
proto.org.couchers.notification_data.ReferenceReminder.prototype.setDaysLeft = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.VerificationSVFail.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.VerificationSVFail.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.VerificationSVFail} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.VerificationSVFail.toObject = function(includeInstance, msg) {
  var f, obj = {
    reason: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.VerificationSVFail}
 */
proto.org.couchers.notification_data.VerificationSVFail.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.VerificationSVFail;
  return proto.org.couchers.notification_data.VerificationSVFail.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.VerificationSVFail} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.VerificationSVFail}
 */
proto.org.couchers.notification_data.VerificationSVFail.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.org.couchers.notification_data.SVFailReason} */ (reader.readEnum());
      msg.setReason(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.VerificationSVFail.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.VerificationSVFail.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.VerificationSVFail} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.VerificationSVFail.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getReason();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional SVFailReason reason = 1;
 * @return {!proto.org.couchers.notification_data.SVFailReason}
 */
proto.org.couchers.notification_data.VerificationSVFail.prototype.getReason = function() {
  return /** @type {!proto.org.couchers.notification_data.SVFailReason} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.org.couchers.notification_data.SVFailReason} value
 * @return {!proto.org.couchers.notification_data.VerificationSVFail} returns this
 */
proto.org.couchers.notification_data.VerificationSVFail.prototype.setReason = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.EventComment.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.EventComment.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.EventComment} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EventComment.toObject = function(includeInstance, msg) {
  var f, obj = {
    reply: (f = msg.getReply()) && threads_pb.Reply.toObject(includeInstance, f),
    event: (f = msg.getEvent()) && events_pb.Event.toObject(includeInstance, f),
    author: (f = msg.getAuthor()) && api_pb.User.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.EventComment}
 */
proto.org.couchers.notification_data.EventComment.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.EventComment;
  return proto.org.couchers.notification_data.EventComment.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.EventComment} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.EventComment}
 */
proto.org.couchers.notification_data.EventComment.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new threads_pb.Reply;
      reader.readMessage(value,threads_pb.Reply.deserializeBinaryFromReader);
      msg.setReply(value);
      break;
    case 2:
      var value = new events_pb.Event;
      reader.readMessage(value,events_pb.Event.deserializeBinaryFromReader);
      msg.setEvent(value);
      break;
    case 3:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setAuthor(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.EventComment.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.EventComment.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.EventComment} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.EventComment.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getReply();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      threads_pb.Reply.serializeBinaryToWriter
    );
  }
  f = message.getEvent();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      events_pb.Event.serializeBinaryToWriter
    );
  }
  f = message.getAuthor();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.threads.Reply reply = 1;
 * @return {?proto.org.couchers.api.threads.Reply}
 */
proto.org.couchers.notification_data.EventComment.prototype.getReply = function() {
  return /** @type{?proto.org.couchers.api.threads.Reply} */ (
    jspb.Message.getWrapperField(this, threads_pb.Reply, 1));
};


/**
 * @param {?proto.org.couchers.api.threads.Reply|undefined} value
 * @return {!proto.org.couchers.notification_data.EventComment} returns this
*/
proto.org.couchers.notification_data.EventComment.prototype.setReply = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventComment} returns this
 */
proto.org.couchers.notification_data.EventComment.prototype.clearReply = function() {
  return this.setReply(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventComment.prototype.hasReply = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.events.Event event = 2;
 * @return {?proto.org.couchers.api.events.Event}
 */
proto.org.couchers.notification_data.EventComment.prototype.getEvent = function() {
  return /** @type{?proto.org.couchers.api.events.Event} */ (
    jspb.Message.getWrapperField(this, events_pb.Event, 2));
};


/**
 * @param {?proto.org.couchers.api.events.Event|undefined} value
 * @return {!proto.org.couchers.notification_data.EventComment} returns this
*/
proto.org.couchers.notification_data.EventComment.prototype.setEvent = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventComment} returns this
 */
proto.org.couchers.notification_data.EventComment.prototype.clearEvent = function() {
  return this.setEvent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventComment.prototype.hasEvent = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional org.couchers.api.core.User author = 3;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.EventComment.prototype.getAuthor = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 3));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.EventComment} returns this
*/
proto.org.couchers.notification_data.EventComment.prototype.setAuthor = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.EventComment} returns this
 */
proto.org.couchers.notification_data.EventComment.prototype.clearAuthor = function() {
  return this.setAuthor(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.EventComment.prototype.hasAuthor = function() {
  return jspb.Message.getField(this, 3) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.DiscussionCreate.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.DiscussionCreate.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.DiscussionCreate} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.DiscussionCreate.toObject = function(includeInstance, msg) {
  var f, obj = {
    discussion: (f = msg.getDiscussion()) && discussions_pb.Discussion.toObject(includeInstance, f),
    author: (f = msg.getAuthor()) && api_pb.User.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.DiscussionCreate}
 */
proto.org.couchers.notification_data.DiscussionCreate.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.DiscussionCreate;
  return proto.org.couchers.notification_data.DiscussionCreate.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.DiscussionCreate} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.DiscussionCreate}
 */
proto.org.couchers.notification_data.DiscussionCreate.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new discussions_pb.Discussion;
      reader.readMessage(value,discussions_pb.Discussion.deserializeBinaryFromReader);
      msg.setDiscussion(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setAuthor(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.DiscussionCreate.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.DiscussionCreate.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.DiscussionCreate} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.DiscussionCreate.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDiscussion();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      discussions_pb.Discussion.serializeBinaryToWriter
    );
  }
  f = message.getAuthor();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.discussions.Discussion discussion = 1;
 * @return {?proto.org.couchers.api.discussions.Discussion}
 */
proto.org.couchers.notification_data.DiscussionCreate.prototype.getDiscussion = function() {
  return /** @type{?proto.org.couchers.api.discussions.Discussion} */ (
    jspb.Message.getWrapperField(this, discussions_pb.Discussion, 1));
};


/**
 * @param {?proto.org.couchers.api.discussions.Discussion|undefined} value
 * @return {!proto.org.couchers.notification_data.DiscussionCreate} returns this
*/
proto.org.couchers.notification_data.DiscussionCreate.prototype.setDiscussion = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.DiscussionCreate} returns this
 */
proto.org.couchers.notification_data.DiscussionCreate.prototype.clearDiscussion = function() {
  return this.setDiscussion(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.DiscussionCreate.prototype.hasDiscussion = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.core.User author = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.DiscussionCreate.prototype.getAuthor = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.DiscussionCreate} returns this
*/
proto.org.couchers.notification_data.DiscussionCreate.prototype.setAuthor = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.DiscussionCreate} returns this
 */
proto.org.couchers.notification_data.DiscussionCreate.prototype.clearAuthor = function() {
  return this.setAuthor(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.DiscussionCreate.prototype.hasAuthor = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.DiscussionComment.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.DiscussionComment.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.DiscussionComment} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.DiscussionComment.toObject = function(includeInstance, msg) {
  var f, obj = {
    reply: (f = msg.getReply()) && threads_pb.Reply.toObject(includeInstance, f),
    discussion: (f = msg.getDiscussion()) && discussions_pb.Discussion.toObject(includeInstance, f),
    author: (f = msg.getAuthor()) && api_pb.User.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.DiscussionComment}
 */
proto.org.couchers.notification_data.DiscussionComment.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.DiscussionComment;
  return proto.org.couchers.notification_data.DiscussionComment.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.DiscussionComment} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.DiscussionComment}
 */
proto.org.couchers.notification_data.DiscussionComment.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new threads_pb.Reply;
      reader.readMessage(value,threads_pb.Reply.deserializeBinaryFromReader);
      msg.setReply(value);
      break;
    case 2:
      var value = new discussions_pb.Discussion;
      reader.readMessage(value,discussions_pb.Discussion.deserializeBinaryFromReader);
      msg.setDiscussion(value);
      break;
    case 3:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setAuthor(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.DiscussionComment.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.DiscussionComment.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.DiscussionComment} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.DiscussionComment.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getReply();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      threads_pb.Reply.serializeBinaryToWriter
    );
  }
  f = message.getDiscussion();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      discussions_pb.Discussion.serializeBinaryToWriter
    );
  }
  f = message.getAuthor();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.threads.Reply reply = 1;
 * @return {?proto.org.couchers.api.threads.Reply}
 */
proto.org.couchers.notification_data.DiscussionComment.prototype.getReply = function() {
  return /** @type{?proto.org.couchers.api.threads.Reply} */ (
    jspb.Message.getWrapperField(this, threads_pb.Reply, 1));
};


/**
 * @param {?proto.org.couchers.api.threads.Reply|undefined} value
 * @return {!proto.org.couchers.notification_data.DiscussionComment} returns this
*/
proto.org.couchers.notification_data.DiscussionComment.prototype.setReply = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.DiscussionComment} returns this
 */
proto.org.couchers.notification_data.DiscussionComment.prototype.clearReply = function() {
  return this.setReply(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.DiscussionComment.prototype.hasReply = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.discussions.Discussion discussion = 2;
 * @return {?proto.org.couchers.api.discussions.Discussion}
 */
proto.org.couchers.notification_data.DiscussionComment.prototype.getDiscussion = function() {
  return /** @type{?proto.org.couchers.api.discussions.Discussion} */ (
    jspb.Message.getWrapperField(this, discussions_pb.Discussion, 2));
};


/**
 * @param {?proto.org.couchers.api.discussions.Discussion|undefined} value
 * @return {!proto.org.couchers.notification_data.DiscussionComment} returns this
*/
proto.org.couchers.notification_data.DiscussionComment.prototype.setDiscussion = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.DiscussionComment} returns this
 */
proto.org.couchers.notification_data.DiscussionComment.prototype.clearDiscussion = function() {
  return this.setDiscussion(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.DiscussionComment.prototype.hasDiscussion = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional org.couchers.api.core.User author = 3;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.DiscussionComment.prototype.getAuthor = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 3));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.DiscussionComment} returns this
*/
proto.org.couchers.notification_data.DiscussionComment.prototype.setAuthor = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.DiscussionComment} returns this
 */
proto.org.couchers.notification_data.DiscussionComment.prototype.clearAuthor = function() {
  return this.setAuthor(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.DiscussionComment.prototype.hasAuthor = function() {
  return jspb.Message.getField(this, 3) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.org.couchers.notification_data.ThreadReply.oneofGroups_ = [[3,4]];

/**
 * @enum {number}
 */
proto.org.couchers.notification_data.ThreadReply.ReplyParentCase = {
  REPLY_PARENT_NOT_SET: 0,
  EVENT: 3,
  DISCUSSION: 4
};

/**
 * @return {proto.org.couchers.notification_data.ThreadReply.ReplyParentCase}
 */
proto.org.couchers.notification_data.ThreadReply.prototype.getReplyParentCase = function() {
  return /** @type {proto.org.couchers.notification_data.ThreadReply.ReplyParentCase} */(jspb.Message.computeOneofCase(this, proto.org.couchers.notification_data.ThreadReply.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.ThreadReply.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.ThreadReply.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.ThreadReply} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ThreadReply.toObject = function(includeInstance, msg) {
  var f, obj = {
    reply: (f = msg.getReply()) && threads_pb.Reply.toObject(includeInstance, f),
    author: (f = msg.getAuthor()) && api_pb.User.toObject(includeInstance, f),
    event: (f = msg.getEvent()) && events_pb.Event.toObject(includeInstance, f),
    discussion: (f = msg.getDiscussion()) && discussions_pb.Discussion.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.ThreadReply}
 */
proto.org.couchers.notification_data.ThreadReply.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.ThreadReply;
  return proto.org.couchers.notification_data.ThreadReply.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.ThreadReply} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.ThreadReply}
 */
proto.org.couchers.notification_data.ThreadReply.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new threads_pb.Reply;
      reader.readMessage(value,threads_pb.Reply.deserializeBinaryFromReader);
      msg.setReply(value);
      break;
    case 2:
      var value = new api_pb.User;
      reader.readMessage(value,api_pb.User.deserializeBinaryFromReader);
      msg.setAuthor(value);
      break;
    case 3:
      var value = new events_pb.Event;
      reader.readMessage(value,events_pb.Event.deserializeBinaryFromReader);
      msg.setEvent(value);
      break;
    case 4:
      var value = new discussions_pb.Discussion;
      reader.readMessage(value,discussions_pb.Discussion.deserializeBinaryFromReader);
      msg.setDiscussion(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.ThreadReply.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.ThreadReply.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.ThreadReply} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ThreadReply.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getReply();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      threads_pb.Reply.serializeBinaryToWriter
    );
  }
  f = message.getAuthor();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      api_pb.User.serializeBinaryToWriter
    );
  }
  f = message.getEvent();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      events_pb.Event.serializeBinaryToWriter
    );
  }
  f = message.getDiscussion();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      discussions_pb.Discussion.serializeBinaryToWriter
    );
  }
};


/**
 * optional org.couchers.api.threads.Reply reply = 1;
 * @return {?proto.org.couchers.api.threads.Reply}
 */
proto.org.couchers.notification_data.ThreadReply.prototype.getReply = function() {
  return /** @type{?proto.org.couchers.api.threads.Reply} */ (
    jspb.Message.getWrapperField(this, threads_pb.Reply, 1));
};


/**
 * @param {?proto.org.couchers.api.threads.Reply|undefined} value
 * @return {!proto.org.couchers.notification_data.ThreadReply} returns this
*/
proto.org.couchers.notification_data.ThreadReply.prototype.setReply = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.ThreadReply} returns this
 */
proto.org.couchers.notification_data.ThreadReply.prototype.clearReply = function() {
  return this.setReply(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.ThreadReply.prototype.hasReply = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional org.couchers.api.core.User author = 2;
 * @return {?proto.org.couchers.api.core.User}
 */
proto.org.couchers.notification_data.ThreadReply.prototype.getAuthor = function() {
  return /** @type{?proto.org.couchers.api.core.User} */ (
    jspb.Message.getWrapperField(this, api_pb.User, 2));
};


/**
 * @param {?proto.org.couchers.api.core.User|undefined} value
 * @return {!proto.org.couchers.notification_data.ThreadReply} returns this
*/
proto.org.couchers.notification_data.ThreadReply.prototype.setAuthor = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.ThreadReply} returns this
 */
proto.org.couchers.notification_data.ThreadReply.prototype.clearAuthor = function() {
  return this.setAuthor(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.ThreadReply.prototype.hasAuthor = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional org.couchers.api.events.Event event = 3;
 * @return {?proto.org.couchers.api.events.Event}
 */
proto.org.couchers.notification_data.ThreadReply.prototype.getEvent = function() {
  return /** @type{?proto.org.couchers.api.events.Event} */ (
    jspb.Message.getWrapperField(this, events_pb.Event, 3));
};


/**
 * @param {?proto.org.couchers.api.events.Event|undefined} value
 * @return {!proto.org.couchers.notification_data.ThreadReply} returns this
*/
proto.org.couchers.notification_data.ThreadReply.prototype.setEvent = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.org.couchers.notification_data.ThreadReply.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.ThreadReply} returns this
 */
proto.org.couchers.notification_data.ThreadReply.prototype.clearEvent = function() {
  return this.setEvent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.ThreadReply.prototype.hasEvent = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional org.couchers.api.discussions.Discussion discussion = 4;
 * @return {?proto.org.couchers.api.discussions.Discussion}
 */
proto.org.couchers.notification_data.ThreadReply.prototype.getDiscussion = function() {
  return /** @type{?proto.org.couchers.api.discussions.Discussion} */ (
    jspb.Message.getWrapperField(this, discussions_pb.Discussion, 4));
};


/**
 * @param {?proto.org.couchers.api.discussions.Discussion|undefined} value
 * @return {!proto.org.couchers.notification_data.ThreadReply} returns this
*/
proto.org.couchers.notification_data.ThreadReply.prototype.setDiscussion = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.org.couchers.notification_data.ThreadReply.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.ThreadReply} returns this
 */
proto.org.couchers.notification_data.ThreadReply.prototype.clearDiscussion = function() {
  return this.setDiscussion(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.ThreadReply.prototype.hasDiscussion = function() {
  return jspb.Message.getField(this, 4) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.ActivenessProbe.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.ActivenessProbe.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.ActivenessProbe} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ActivenessProbe.toObject = function(includeInstance, msg) {
  var f, obj = {
    reminderNumber: jspb.Message.getFieldWithDefault(msg, 1, 0),
    deadline: (f = msg.getDeadline()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.ActivenessProbe}
 */
proto.org.couchers.notification_data.ActivenessProbe.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.ActivenessProbe;
  return proto.org.couchers.notification_data.ActivenessProbe.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.ActivenessProbe} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.ActivenessProbe}
 */
proto.org.couchers.notification_data.ActivenessProbe.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setReminderNumber(value);
      break;
    case 2:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setDeadline(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.ActivenessProbe.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.ActivenessProbe.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.ActivenessProbe} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.ActivenessProbe.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getReminderNumber();
  if (f !== 0) {
    writer.writeUint64(
      1,
      f
    );
  }
  f = message.getDeadline();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional uint64 reminder_number = 1;
 * @return {number}
 */
proto.org.couchers.notification_data.ActivenessProbe.prototype.getReminderNumber = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.org.couchers.notification_data.ActivenessProbe} returns this
 */
proto.org.couchers.notification_data.ActivenessProbe.prototype.setReminderNumber = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional google.protobuf.Timestamp deadline = 2;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.org.couchers.notification_data.ActivenessProbe.prototype.getDeadline = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 2));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.org.couchers.notification_data.ActivenessProbe} returns this
*/
proto.org.couchers.notification_data.ActivenessProbe.prototype.setDeadline = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.org.couchers.notification_data.ActivenessProbe} returns this
 */
proto.org.couchers.notification_data.ActivenessProbe.prototype.clearDeadline = function() {
  return this.setDeadline(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.org.couchers.notification_data.ActivenessProbe.prototype.hasDeadline = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.org.couchers.notification_data.GeneralNewBlogPost.prototype.toObject = function(opt_includeInstance) {
  return proto.org.couchers.notification_data.GeneralNewBlogPost.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.org.couchers.notification_data.GeneralNewBlogPost} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.GeneralNewBlogPost.toObject = function(includeInstance, msg) {
  var f, obj = {
    url: jspb.Message.getFieldWithDefault(msg, 1, ""),
    title: jspb.Message.getFieldWithDefault(msg, 2, ""),
    blurb: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.org.couchers.notification_data.GeneralNewBlogPost}
 */
proto.org.couchers.notification_data.GeneralNewBlogPost.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.org.couchers.notification_data.GeneralNewBlogPost;
  return proto.org.couchers.notification_data.GeneralNewBlogPost.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.org.couchers.notification_data.GeneralNewBlogPost} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.org.couchers.notification_data.GeneralNewBlogPost}
 */
proto.org.couchers.notification_data.GeneralNewBlogPost.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUrl(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTitle(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setBlurb(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.org.couchers.notification_data.GeneralNewBlogPost.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.org.couchers.notification_data.GeneralNewBlogPost.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.org.couchers.notification_data.GeneralNewBlogPost} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.org.couchers.notification_data.GeneralNewBlogPost.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUrl();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getTitle();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getBlurb();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string url = 1;
 * @return {string}
 */
proto.org.couchers.notification_data.GeneralNewBlogPost.prototype.getUrl = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.GeneralNewBlogPost} returns this
 */
proto.org.couchers.notification_data.GeneralNewBlogPost.prototype.setUrl = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string title = 2;
 * @return {string}
 */
proto.org.couchers.notification_data.GeneralNewBlogPost.prototype.getTitle = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.GeneralNewBlogPost} returns this
 */
proto.org.couchers.notification_data.GeneralNewBlogPost.prototype.setTitle = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string blurb = 3;
 * @return {string}
 */
proto.org.couchers.notification_data.GeneralNewBlogPost.prototype.getBlurb = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.org.couchers.notification_data.GeneralNewBlogPost} returns this
 */
proto.org.couchers.notification_data.GeneralNewBlogPost.prototype.setBlurb = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * @enum {number}
 */
proto.org.couchers.notification_data.SVFailReason = {
  SV_FAIL_REASON_UNKNOWN: 0,
  SV_FAIL_REASON_WRONG_BIRTHDATE_OR_GENDER: 1,
  SV_FAIL_REASON_NOT_A_PASSPORT: 2,
  SV_FAIL_REASON_DUPLICATE: 3
};

goog.object.extend(exports, proto.org.couchers.notification_data);
