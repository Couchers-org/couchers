import json
import logging

import requests

from couchers.db import session_scope
from couchers.models import Region, RegionPolygon

logger = logging.getLogger(__name__)


def _get_populations_from_wikidata():
    """
    Returns dictionary of {alpha3: population} or None

    Throws whatever on error
    """
    res = requests.get(
        "https://query.wikidata.org/sparql",
        params={
            "query": """
            # grab the ISO-3166-1 alpha3 code, and max population
            SELECT ?alpha3 (MAX(?pop) AS ?maxpop)
            WHERE {
                # items that have property P298 (the alpha3 code)
                ?country wdt:P298 ?alpha3.
                # get the population
                ?country wdt:P1082 ?pop.

                # filter out those that have a date and there is a result already with a later date
                FILTER NOT EXISTS {
                    ?country p:P1082/pq:P585 ?pop_date_ .
                    FILTER (?pop_date_ > ?pop_date)
                }
            }
            GROUP BY ?alpha3
            """,
            "format": "json",
        },
    )
    # this doesn't return everything, there's like 3 exceptions, including things like Antarctica
    return {result["alpha3"]["value"]: int(result["maxpop"]["value"]) for result in res.json()["results"]["bindings"]}


def update_regions(include_population=False):
    """
    Syncs the database regions with regions.json.

    It syncs based on alpha3, and makes sure the other fields match. If the region does not exist, updates population
    from wikidata. It does not touch regions that are not in `regions.json`!
    """
    logger.info(f"Ensuring all regions exist in database")

    with open("src/data/regions.json", "r") as file:
        data = json.loads(file.read())

    if include_population:
        populations = _get_populations_from_wikidata()

    with session_scope() as session:
        for region_data in data:
            name = region_data["name"]
            wikidata = region_data["wikidata"]
            alpha2 = region_data["alpha2"]
            alpha3 = region_data["alpha3"]

            region = session.query(Region).filter(Region.alpha3 == alpha3).one_or_none()

            if region:
                # region exists, check it matches json
                if (
                    region.alpha2 != alpha2
                    or region.name != name
                    or region.wikidata_id != wikidata
                    or (include_population and region.population != populations.get(alpha3, 0))
                ):
                    region.alpha2 = alpha2
                    region.name = name
                    region.wikidata_id = wikidata
                    if include_population:
                        region.population = populations.get(alpha3, 0)
            else:
                session.add(
                    Region(
                        alpha3=alpha3,
                        alpha2=alpha2,
                        name=name,
                        population=populations.get(alpha3, 0) if include_population else 0,
                        wikidata_id=wikidata,
                    )
                )
