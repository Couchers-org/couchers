var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { CancelFriendRequestReq, PingReq, RespondFriendRequestReq, SendFriendRequestReq, } from "proto/api_pb";
import { FETCH_FAILED, IMAGE_TOO_LARGE, INTERNAL_ERROR, SERVER_ERROR, } from "service/constants";
import client from "./client";
export function cancelFriendRequest(friendRequestId) {
    var req = new CancelFriendRequestReq();
    req.setFriendRequestId(friendRequestId);
    return client.api.cancelFriendRequest(req);
}
export function listFriends() {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new Empty();
                    return [4 /*yield*/, client.api.listFriends(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject().userIdsList];
            }
        });
    });
}
export function listFriendRequests() {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new Empty();
                    return [4 /*yield*/, client.api.listFriendRequests(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function respondFriendRequest(friendRequestId, accept) {
    var req = new RespondFriendRequestReq();
    req.setFriendRequestId(friendRequestId);
    req.setAccept(accept);
    return client.api.respondFriendRequest(req);
}
export function sendFriendRequest(userId) {
    var req = new SendFriendRequestReq();
    req.setUserId(userId);
    return client.api.sendFriendRequest(req);
}
export function ping() {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new PingReq();
                    return [4 /*yield*/, client.api.ping(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function uploadFile(file) {
    return __awaiter(this, void 0, void 0, function () {
        var urlResponse, uploadURL, requestBody, uploadResponse, responseJson;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.api.initiateMediaUpload(new Empty())];
                case 1:
                    urlResponse = _a.sent();
                    uploadURL = urlResponse.getUploadUrl();
                    requestBody = new FormData();
                    requestBody.append("file", file);
                    return [4 /*yield*/, fetch(uploadURL, {
                            method: "POST",
                            body: requestBody,
                        }).catch(function (e) {
                            console.error(e);
                            throw new Error(FETCH_FAILED);
                        })];
                case 2:
                    uploadResponse = _a.sent();
                    if (uploadResponse.status === 413) {
                        throw new Error(IMAGE_TOO_LARGE);
                    }
                    else if (!uploadResponse.ok) {
                        throw new Error(SERVER_ERROR + ": " + uploadResponse.statusText);
                    }
                    return [4 /*yield*/, uploadResponse.json().catch(function (e) {
                            console.error(e);
                            throw new Error(INTERNAL_ERROR + ": " + e.message);
                        })];
                case 3:
                    responseJson = _a.sent();
                    return [2 /*return*/, __assign(__assign({}, responseJson), { file: file })];
            }
        });
    });
}
//# sourceMappingURL=api.js.map