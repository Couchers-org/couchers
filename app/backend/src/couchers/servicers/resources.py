import logging

from couchers.resources import get_language_dict, get_region_dict, get_terms_of_service
from proto import resources_pb2, resources_pb2_grpc

logger = logging.getLogger(__name__)


class Resources(resources_pb2_grpc.ResourcesServicer):
    def GetTermsOfService(self, request, context):
        return resources_pb2.GetTermsOfServiceRes(terms_of_service=get_terms_of_service())

    def GetRegions(self, request, context):
        return resources_pb2.GetRegionsRes(
            regions=[
                resources_pb2.Region(alpha3=alpha3, name=name) for alpha3, name in sorted(get_region_dict().items())
            ]
        )

    def GetLanguages(self, request, context):
        return resources_pb2.GetLanguagesRes(
            languages=[
                resources_pb2.Language(code=code, name=name) for code, name in sorted(get_language_dict().items())
            ]
        )
