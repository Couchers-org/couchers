import logging

from couchers.resources import (
    get_badge_dict,
    get_community_guidelines,
    get_language_dict,
    get_region_dict,
    get_terms_of_service,
)
from proto import resources_pb2, resources_pb2_grpc

logger = logging.getLogger(__name__)


class Resources(resources_pb2_grpc.ResourcesServicer):
    def GetTermsOfService(self, request, context, session):
        return resources_pb2.GetTermsOfServiceRes(terms_of_service=get_terms_of_service())

    def GetCommunityGuidelines(self, request, context, session):
        return resources_pb2.GetCommunityGuidelinesRes(community_guidelines=get_community_guidelines())

    def GetRegions(self, request, context, session):
        return resources_pb2.GetRegionsRes(
            regions=[
                resources_pb2.Region(alpha3=alpha3, name=name) for alpha3, name in sorted(get_region_dict().items())
            ]
        )

    def GetLanguages(self, request, context, session):
        return resources_pb2.GetLanguagesRes(
            languages=[
                resources_pb2.Language(code=code, name=name) for code, name in sorted(get_language_dict().items())
            ]
        )

    def GetBadges(self, request, context, session):
        return resources_pb2.GetBadgesRes(
            badges=[
                resources_pb2.Badge(
                    id=badge["id"], name=badge["name"], description=badge["description"], color=badge["color"]
                )
                for badge in get_badge_dict().values()
            ]
        )
