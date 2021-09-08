var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { BoolValue, StringValue, } from "google-protobuf/google/protobuf/wrappers_pb";
import { StatusCode } from "grpc-web";
import { CreateGroupChatReq, EditGroupChatReq, GetDirectMessageReq, GetGroupChatMessagesReq, GetGroupChatReq, InviteToGroupChatReq, LeaveGroupChatReq, ListGroupChatsReq, MakeGroupChatAdminReq, MarkLastSeenGroupChatReq, RemoveGroupChatAdminReq, SendMessageReq, } from "proto/conversations_pb";
import client from "service/client";
import isGrpcError from "utils/isGrpcError";
export function listGroupChats(lastMessageId, count) {
    if (lastMessageId === void 0) { lastMessageId = 0; }
    if (count === void 0) { count = 10; }
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new ListGroupChatsReq();
                    req.setLastMessageId(lastMessageId);
                    req.setNumber(count);
                    return [4 /*yield*/, client.conversations.listGroupChats(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function getGroupChat(id) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new GetGroupChatReq();
                    req.setGroupChatId(id);
                    return [4 /*yield*/, client.conversations.getGroupChat(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function getGroupChatMessages(groupChatId, lastMessageId, count) {
    if (lastMessageId === void 0) { lastMessageId = 0; }
    if (count === void 0) { count = 20; }
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new GetGroupChatMessagesReq();
                    req.setGroupChatId(groupChatId);
                    req.setLastMessageId(lastMessageId);
                    req.setNumber(count);
                    return [4 /*yield*/, client.conversations.getGroupChatMessages(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function createGroupChat(title, users) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response, groupChatId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new CreateGroupChatReq();
                    req.setRecipientUserIdsList(users.map(function (user) { return user.userId; }));
                    req.setTitle(new StringValue().setValue(title));
                    return [4 /*yield*/, client.conversations.createGroupChat(req)];
                case 1:
                    response = _a.sent();
                    groupChatId = response.getGroupChatId();
                    return [2 /*return*/, groupChatId];
            }
        });
    });
}
export function sendMessage(groupChatId, text) {
    return __awaiter(this, void 0, void 0, function () {
        var req;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new SendMessageReq();
                    req.setGroupChatId(groupChatId);
                    req.setText(text);
                    return [4 /*yield*/, client.conversations.sendMessage(req)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
export function leaveGroupChat(groupChatId) {
    var req = new LeaveGroupChatReq();
    req.setGroupChatId(groupChatId);
    return client.conversations.leaveGroupChat(req);
}
export function inviteToGroupChat(groupChatId, users) {
    var promises = users.map(function (user) {
        var req = new InviteToGroupChatReq();
        req.setGroupChatId(groupChatId);
        req.setUserId(user.userId);
        return client.conversations.inviteToGroupChat(req);
    });
    return Promise.all(promises);
}
export function makeGroupChatAdmin(groupChatId, user) {
    var req = new MakeGroupChatAdminReq();
    req.setGroupChatId(groupChatId);
    req.setUserId(user.userId);
    return client.conversations.makeGroupChatAdmin(req);
}
export function removeGroupChatAdmin(groupChatId, user) {
    var req = new RemoveGroupChatAdminReq();
    req.setGroupChatId(groupChatId);
    req.setUserId(user.userId);
    return client.conversations.removeGroupChatAdmin(req);
}
export function editGroupChat(groupChatId, title, onlyAdminsInvite) {
    var req = new EditGroupChatReq();
    req.setGroupChatId(groupChatId);
    if (title !== undefined)
        req.setTitle(new StringValue().setValue(title));
    if (onlyAdminsInvite !== undefined)
        req.setOnlyAdminsInvite(new BoolValue().setValue(onlyAdminsInvite));
    return client.conversations.editGroupChat(req);
}
export function markLastSeenGroupChat(groupChatId, lastSeenMessageId) {
    var req = new MarkLastSeenGroupChatReq();
    req.setGroupChatId(groupChatId);
    req.setLastSeenMessageId(lastSeenMessageId);
    return client.conversations.markLastSeenGroupChat(req);
}
export function getDirectMessage(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var req, res, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new GetDirectMessageReq();
                    req.setUserId(userId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, client.conversations.getDirectMessage(req)];
                case 2:
                    res = _a.sent();
                    return [2 /*return*/, res.getGroupChatId()];
                case 3:
                    e_1 = _a.sent();
                    if (isGrpcError(e_1) && e_1.code === StatusCode.NOT_FOUND) {
                        return [2 /*return*/, false];
                    }
                    else {
                        throw e_1;
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=conversations.js.map