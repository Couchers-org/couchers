import logging

from google.protobuf import empty_pb2
from sqlalchemy.orm import Session

from couchers.context import CouchersContext
from couchers.proto import resources_pb2, resources_pb2_grpc
from couchers.resources import (
    get_badge_dict,
    get_icon,
    get_language_dict,
    get_region_dict,
    get_terms_of_service,
)

logger = logging.getLogger(__name__)

COMMUNITY_GUIDELINES = [
    {"key": "be_kind", "icon": "hand_with_heart.svg"},
    {"key": "no_dating", "icon": "ghost.svg"},
    {"key": "be_safe", "icon": "shield.svg"},
    {"key": "no_money", "icon": "handshake.svg"},
]


class Resources(resources_pb2_grpc.ResourcesServicer):
    def GetTermsOfService(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> resources_pb2.GetTermsOfServiceRes:
        return resources_pb2.GetTermsOfServiceRes(terms_of_service=get_terms_of_service())

    def GetCommunityGuidelines(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> resources_pb2.GetCommunityGuidelinesRes:
        return resources_pb2.GetCommunityGuidelinesRes(
            community_guidelines=[
                resources_pb2.CommunityGuideline(
                    title=context.localization.localize_string(f"community_guidelines.{cg['key']}_title"),
                    guideline=context.localization.localize_string(f"community_guidelines.{cg['key']}_guideline"),
                    icon_svg=get_icon(cg["icon"]),
                )
                for cg in COMMUNITY_GUIDELINES
            ]
        )

    def GetRegions(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> resources_pb2.GetRegionsRes:
        return resources_pb2.GetRegionsRes(
            regions=[
                resources_pb2.Region(alpha3=alpha3, name=name) for alpha3, name in sorted(get_region_dict().items())
            ]
        )

    def GetLanguages(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> resources_pb2.GetLanguagesRes:
        return resources_pb2.GetLanguagesRes(
            languages=[
                resources_pb2.Language(code=code, name=name) for code, name in sorted(get_language_dict().items())
            ]
        )

    def GetBadges(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> resources_pb2.GetBadgesRes:
        return resources_pb2.GetBadgesRes(
            badges=[
                resources_pb2.Badge(
                    id=badge.id,
                    name=context.localization.localize_string(f"badges.{badge.id}_name"),
                    description=context.localization.localize_string(f"badges.{badge.id}_description"),
                    color=badge.color,
                )
                for badge in get_badge_dict().values()
            ]
        )
