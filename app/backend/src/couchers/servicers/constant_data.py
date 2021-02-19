from couchers.db import session_scope
from couchers.models import Language
from pb import constant_data_pb2, constant_data_pb2_grpc


class ConstantData(constant_data_pb2_grpc.ConstantDataServicer):
    def GetLanguageList(self, request, context):
        with session_scope() as session:
            return constant_data_pb2.GetLanguageListRes(
                languages=[
                    constant_data_pb2.Language(
                        code=language.code,
                        name=language.name,
                    )
                    for language in session.query(Language).all()
                ]
            )
