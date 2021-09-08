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
import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";
import { ChangeEmailReq, ChangePasswordReq, FillContributorFormReq, } from "proto/account_pb";
import { CompletePasswordResetReq, ConfirmChangeEmailReq, ResetPasswordReq, } from "proto/auth_pb";
import client from "service/client";
import { contributorFormFromObject } from "./auth";
export function getAccountInfo() {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.account.getAccountInfo(new Empty())];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
export function resetPassword(userId) {
    var req = new ResetPasswordReq();
    req.setUser(userId);
    return client.auth.resetPassword(req);
}
export function completePasswordReset(resetToken) {
    var req = new CompletePasswordResetReq();
    req.setPasswordResetToken(resetToken);
    return client.auth.completePasswordReset(req);
}
export function changePassword(oldPassword, newPassword) {
    var req = new ChangePasswordReq();
    if (oldPassword) {
        req.setOldPassword(new StringValue().setValue(oldPassword));
    }
    if (newPassword) {
        req.setNewPassword(new StringValue().setValue(newPassword));
    }
    return client.account.changePassword(req);
}
export function changeEmail(newEmail, currentPassword) {
    var req = new ChangeEmailReq();
    req.setNewEmail(newEmail);
    if (currentPassword) {
        req.setPassword(new StringValue().setValue(currentPassword));
    }
    return client.account.changeEmail(req);
}
export function confirmChangeEmail(resetToken) {
    return __awaiter(this, void 0, void 0, function () {
        var req;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new ConfirmChangeEmailReq();
                    req.setChangeEmailToken(resetToken);
                    return [4 /*yield*/, client.auth.confirmChangeEmail(req)];
                case 1: return [2 /*return*/, (_a.sent()).toObject()];
            }
        });
    });
}
export function getContributorFormInfo() {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.account.getContributorFormInfo(new Empty())];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
export function fillContributorForm(form) {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.account.fillContributorForm(new FillContributorFormReq().setContributorForm(contributorFormFromObject(form)))];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
//# sourceMappingURL=account.js.map