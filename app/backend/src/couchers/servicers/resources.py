import logging

from couchers.resources import get_language_dict, get_region_dict, get_terms_of_service
from pb import resources_pb2, resources_pb2_grpc

logger = logging.getLogger(__name__)


class Resources(resources_pb2_grpc.ResourcesServicer):
    def GetTermsOfService(self, request, context):
        return resources_pb2.GetTermsOfServiceRes(terms_of_service=get_terms_of_service())

    def GetRegions(self, request, context):
        return resources_pb2.GetRegionsRes(regions=get_region_dict())

    def GetLanguages(self, request, context):
        return resources_pb2.GetLanguagesRes(languages=get_language_dict())
