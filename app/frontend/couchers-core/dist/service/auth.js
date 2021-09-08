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
import { BoolValue } from "google-protobuf/google/protobuf/wrappers_pb";
import { ContributorForm as ContributorFormPb, LoginReq, SignupAccount, SignupBasic, SignupFlowReq, UsernameValidReq, } from "proto/auth_pb";
import client from "service/client";
export function checkUsername(username) {
    return __awaiter(this, void 0, void 0, function () {
        var req, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new LoginReq();
                    req.setUser(username);
                    return [4 /*yield*/, client.auth.login(req)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.getNextStep()];
            }
        });
    });
}
export function startSignup(name, email) {
    return __awaiter(this, void 0, void 0, function () {
        var req, basic, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new SignupFlowReq();
                    basic = new SignupBasic();
                    basic.setName(name);
                    basic.setEmail(email);
                    req.setBasic(basic);
                    return [4 /*yield*/, client.auth.signupFlow(req)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
export function signupFlowAccount(_a) {
    var flowToken = _a.flowToken, username = _a.username, password = _a.password, birthdate = _a.birthdate, gender = _a.gender, acceptTOS = _a.acceptTOS, hostingStatus = _a.hostingStatus, city = _a.city, lat = _a.lat, lng = _a.lng, radius = _a.radius;
    return __awaiter(this, void 0, void 0, function () {
        var req, account, res;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    req = new SignupFlowReq();
                    req.setFlowToken(flowToken);
                    account = new SignupAccount();
                    account.setUsername(username);
                    account.setBirthdate(birthdate);
                    account.setGender(gender);
                    account.setAcceptTos(acceptTOS);
                    account.setHostingStatus(hostingStatus);
                    account.setCity(city);
                    account.setLat(lat);
                    account.setLng(lng);
                    account.setRadius(radius);
                    if (password) {
                        account.setPassword(password);
                    }
                    req.setAccount(account);
                    return [4 /*yield*/, client.auth.signupFlow(req)];
                case 1:
                    res = _b.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
export function contributorFormFromObject(form) {
    var formData = new ContributorFormPb();
    formData
        .setIdeas(form.ideas)
        .setFeatures(form.features)
        .setExperience(form.experience)
        .setContribute(form.contribute)
        .setContributeWaysList(form.contributeWaysList)
        .setExpertise(form.expertise);
    return formData;
}
export function signupFlowFeedback(flowToken, form) {
    return __awaiter(this, void 0, void 0, function () {
        var req, formData, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new SignupFlowReq();
                    req.setFlowToken(flowToken);
                    formData = contributorFormFromObject(form);
                    req.setFeedback(formData);
                    return [4 /*yield*/, client.auth.signupFlow(req)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
export function signupFlowEmailToken(emailToken) {
    return __awaiter(this, void 0, void 0, function () {
        var req, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new SignupFlowReq();
                    req.setEmailToken(emailToken);
                    return [4 /*yield*/, client.auth.signupFlow(req)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
export function signupFlowCommunityGuidelines(flowToken, accept) {
    return __awaiter(this, void 0, void 0, function () {
        var req, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new SignupFlowReq();
                    req.setFlowToken(flowToken);
                    req.setAcceptCommunityGuidelines(new BoolValue().setValue(accept));
                    return [4 /*yield*/, client.auth.signupFlow(req)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
export function validateUsername(username) {
    return __awaiter(this, void 0, void 0, function () {
        var req, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new UsernameValidReq();
                    req.setUsername(username);
                    return [4 /*yield*/, client.auth.usernameValid(req)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.getValid()];
            }
        });
    });
}
//# sourceMappingURL=auth.js.map