import logging
from ipaddress import IPv4Network, IPv6Network

import geoip2.database
from geoip2.errors import AddressNotFoundError

from couchers.config import Config

logger = logging.getLogger(__name__)


def geoip_approximate_location(ip_address: str | None) -> str | None:
    if Config.current.geolite2_city_mmdb_file_location == "":
        return None
    if ip_address is None:
        return None
    try:
        with geoip2.database.Reader(Config.current.geolite2_city_mmdb_file_location) as reader:
            response = reader.city(ip_address)
            city = response.city.name
            country = response.country.name
            return f"{city}, {country}" if city else f"{country}"
    except AddressNotFoundError:
        return None
    except Exception as e:
        logger.error(f"GeoIP failed for {ip_address=}")
        return None


def geoip_asn(ip_address: str | None) -> tuple[int, str, IPv4Network | IPv6Network] | None:
    if Config.current.geolite2_asn_mmdb_file_location == "":
        return None
    if ip_address is None:
        return None
    try:
        with geoip2.database.Reader(Config.current.geolite2_asn_mmdb_file_location) as reader:
            response = reader.asn(ip_address)
            asn_number = response.autonomous_system_number
            asn_org = response.autonomous_system_organization
            network = response.network
            if asn_number is not None and asn_org is not None and network is not None:
                return asn_number, asn_org, network
            raise ValueError(f"Invalid response: {response}")
    except AddressNotFoundError:
        return None
    except Exception as e:
        logger.error(f"GeoIP failed for {ip_address=}")
        return None
