import logging

import geoip2.database
from geoip2.errors import AddressNotFoundError

from couchers.config import config

logger = logging.getLogger(__name__)


def geoip_approximate_location(ip_address: str) -> str:
    if config["GEOLITE2_CITY_MMDB_FILE_LOCATION"] == "":
        return "Unknown"
    try:
        with geoip2.database.Reader(config["GEOLITE2_CITY_MMDB_FILE_LOCATION"]) as reader:
            response = reader.city(ip_address)
            return f"{response.city.name}, {response.country.name}"
    except AddressNotFoundError:
        return "Unknown"
    except Exception as e:
        logger.error(f"GeoIP failed for {ip_address=}")
