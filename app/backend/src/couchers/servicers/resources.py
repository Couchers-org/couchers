import logging
from pathlib import Path

import grpc

from pb import resources_pb2, resources_pb2_grpc

logger = logging.getLogger(__name__)

resources_folder = Path(__file__).parent / ".." / ".." / ".." / "resources"


class Resources(resources_pb2_grpc.ResourcesServicer):
    def GetTermsOfService(self, request, context):
        with open(resources_folder / "terms_of_service.md", "r") as f:
            return resources_pb2.GetTermsOfServiceRes(terms_of_service=f.read())
