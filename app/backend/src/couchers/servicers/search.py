from couchers.db import session_scope
from pb import search_pb2, search_pb2_grpc


class Search(search_pb2_grpc.SearchServicer):
    def Search(self, request, context):
        with session_scope() as session:
            return search_pb2.SearchRes()

    def UserSearch(self, request, context):
        with session_scope() as session:
            return search_pb2.UserSearchRes()
