# Life of an RPC call through the backend

## The setup

We use the gRPC framework for our backend. RPC stands for Remote Procedure Call, that is, invoking a method (procedure) on a remote machine (our backend server). Every possible RPC (or API method) is defined in a definition file (with a `.proto` extension) in the `//app/pb` folder. Each file defines a `service` (a grouping of methods), the actual methods, and the request and response message types of each function. Here is the `//app/pb/account.proto` file with only the stuff related to the `GetAccountInfo` call:

```proto3
syntax = "proto3";

package org.couchers.api.account;

import "google/protobuf/empty.proto";

service Account {
  rpc GetAccountInfo(google.protobuf.Empty) returns (GetAccountInfoRes) {
    // Get information about the user's account
  }
}

message GetAccountInfoRes {
  enum LoginMethod {
    MAGIC_LINK = 0;
    PASSWORD = 1;
  }

  LoginMethod login_method = 1;
  bool has_password = 2;
}
```

Here we see that this RPC is within the `Account` service. The request type is a `google.protobuf.Empty` message (if you go to this file, it's really just this message: `message Empty {}`), so the call takes no arguments. The response type is `GetAccountInfoRes`. The `GetAccountInfo` just returns a bit of info about the user who called the function, which is used in the settings screen to show the user info. (We allow users to not have a password. If a user has not set a password, we'll email them a "magic link" with a unique code each time they wish to log in.)

Our convention is to call request types `NameReq` and response types `NameRes`, where `Name` is the name of the RPC. Leave the service definition at the top and try to keep the messages in the order that they first appear in the service definition.

The messages are described as protocol buffers (protos, or protobufs). There's some decent documentation for it [here](https://developers.google.com/protocol-buffers/). Basically a `message` is like a struct, consisting of *fields*, where each field has a *type*, a *name*, and a *field number*. Protobuf is a very space efficient and fast binary encoding, and so once serialized, the actual message does not contain the name of the field, only the field number. Here we have the `has_password` field, which is a boolean (`bool`) and has field number `2`. The `login_method` field is an enumeration type called `LoginMethod` and has field number `1`. That enumeration is defined above with the `enum` keyword. In an enumeration, the enumeration numbering instead indicates what integer will be used to represent that option.

## Routing

The RPCs are routed by gRPC. At startup (see `//app/backend/src/app.py`) we create a few `grpc.server`s, and attach servicer instances to these. The gRPC server listens on a port and routes the right RPC to the right Python method using the lookup table created at startup. There are different servers for different authentication levels (unauthenticated, "jailed", and logged in user), allowing us to easily apply authentication. (That also means authentication is per-service, not per-method.)

## Life of an RPC call

We'll look again at the `GetAccountInfo` RPC calls. Here is the relevant part of the actual backend implementation from `//app/backend/src/couchers/servicers/account.py`:

```py3
class Account(account_pb2_grpc.AccountServicer):
    def GetAccountInfo(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            if not user.hashed_password:
                return account_pb2.GetAccountInfoRes(
                    login_method=account_pb2.GetAccountInfoRes.LoginMethod.MAGIC_LINK,
                    has_password=False,
                )
            else:
                return account_pb2.GetAccountInfoRes(
                    login_method=account_pb2.GetAccountInfoRes.LoginMethod.PASSWORD,
                    has_password=True,
                )
```

Here is a conceptual explanation of how the API system services a `GetAccountInfo` RPC:

1. For an RPC call to hit the backend, it must be sent to the port that one of the gRPC servers is listening on.
2. Once the server receives the request, it passes it on to each of the *interceptors* of the server, defined in `//app/backend/src/app.py`. Each interceptor receives the RPC and does something with it, either cancelling the call (e.g. if the user is not logged in) or passing it on to the next interceptor.
3. The main interceptor that runs is the `AuthValidatorInterceptor` (in `//app/backend/src/couchers/interceptors.py`) that looks up the API key in the call (from a cookie in the *metadata*, which are the HTTP headers) and makes sure it's valid, as well as looks up the user id corresponding to the key. The user id is injected into the `context` (an object passed down to the method handler) as `user_id`. The interceptor will cancel the call and return an error if no valid API key is found in the cookies.
4. Once the authenticators have each been executed and the RPC is allowed to continue, gRPC routes it to the right class method in Python. This is done using the lookup table created at startup (see the Routing section above). In this case, the full name of the RPC call is `org.couchers.api.account.Account/GetAccountInfo`, and it's routed to the `couchers.servicers.account.Account` class instance instantiated in `//app/backend/src/app.py`. In particular, the method `GetAccountInfo` is called in `//app/backend/src/couchers/servicers/account.py`.
5. gRPC also looks up the request type and deserializes the incoming request, turning it into a Python object. In particular, gRPC calls the `empty_pb2.Empty.FromString` function on the incoming message (this doesn't do much).
6. The `GetAccountInfo` in `account.py` (found in step 4) is actually invoked. The method signature is `def GetAccountInfo(self, request, context)`. `self` is just a reference to the class instance, and we never use it for antyhing. `request` is the `empty_pb2.Empty` Python object created (in step 5), containing the request fields. `context` contains some contextual info for the RPC, including two bits of interest: a `context.abort` function that allows aborting the RPC (erroring out with an error code and message), and the `context.user_id` with the calling user's id (from step 3).
7. The actual logic of the RPC occurs. The `with session_scope() as session` opens a PostgreSQL database transaction, and `session.query(User).filter(User.id == context.user_id).one()` runs a SELECT query to get the row corresponding to the user's id. SQLAlchemy turns this into a `User` object, defined in the models. We then check whether the user has a password, and return an `account_pb2.GetAccountInfoRes` object with the right fields filled in.
8. Once the function returns, gRPC serializes the message, by calling `account_pb2.GetAccountInfoRes.SerializeToString` on the returned object.
9. The interceptors then have a chance to do some more processing, each returning now in the opposite order. For us, `TracingInterceptor` stores a trace of the API call, and if the RPC failed, `ErrorSanitizationInterceptor` removes any unhandled exceptions from the error and instead returns a generic "unknown error".
10. gRPC then sends the message back to the client which can use the response for whatever it wanted it for.
