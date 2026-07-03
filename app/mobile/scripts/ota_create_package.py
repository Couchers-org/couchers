#!/usr/bin/env python3
import os

import couchers
from couchers.proto import admin_pb2

client = couchers.get_client(os.environ["STAGING_BACKEND_API_KEY"], server_address=os.environ["BACKEND_SERVER_ADDRESS"])
version = os.environ["OTA_VERSION"]

for name, platform in [("ios", admin_pb2.OTA_PLATFORM_IOS), ("android", admin_pb2.OTA_PLATFORM_ANDROID)]:
    res = client.admin.CreateOTAPackage(admin_pb2.CreateOTAPackageReq(platform=platform, version=version))
    print(f"Registered {name} OTA {version} -> ota_package_id={res.ota_package_id}")
