import logging

import geoip2.database
from geoip2.errors import AddressNotFoundError

from couchers.config import config

logger = logging.getLogger(__name__)


def geoip_approximate_location(ip_address: str) -> str:
    if config["GEOLITE2_CITY_MMDB_FILE_LOCATION"] == "":
        return
    if ip_address is None:
        return
    try:
        with geoip2.database.Reader(config["GEOLITE2_CITY_MMDB_FILE_LOCATION"]) as reader:
            response = reader.city(ip_address)
            city = response.city.name
            country = response.country.name
            return f"{city}, {country}" if city else f"{country}"
    except AddressNotFoundError:
        pass
    except Exception as e:
        logger.error(f"GeoIP failed for {ip_address=}")
