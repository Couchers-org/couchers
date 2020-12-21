from pb import api_pb2, communities_pb2, communities_pb2_grpc


class Conversations(communities_pb2_grpc.CommunitiesServicer):
    def CreatePage(self, request, context):
        pass
