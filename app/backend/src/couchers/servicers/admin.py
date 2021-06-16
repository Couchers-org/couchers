import grpc
from google.protobuf import empty_pb2

from couchers.db import session_scope
from couchers.models import User
from proto import admin_pb2, admin_pb2_grpc


class Admin(admin_pb2_grpc.AdminServicer):
    def GetUserEmailById(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == request.user_id).one()
            return admin_pb2.GetUserEmailResponse(user.id, user.email)

    def GetUserEmailByName(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.name == request.username).one()
            return admin_pb2.GetUserEmailResponse(user.id, user.email)

    def CreateCommunity(self, request, context):
        pass

    def BanUser(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == request.user_id).one()
            user.is_banned = True
            session.add(user)
            session.commit()
            return empty_pb2.Empty

    def DeleteUser(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == request.user_id).one()
            user.is_deleted = True
            session.add(user)
            session.commit()
            return empty_pb2.Empty
