import csv
import os
import sys
import math
import random
import logging
import faker
import multiprocessing
from couchers.models import (
    User,
)
from couchers import config
from couchers.crypto import hash_password
from couchers.servicers.api import hostingstatus2sql
from couchers.utils import create_coordinate
from couchers.db import session_scope

fake = faker.Faker()

logger = logging.getLogger(__name__)

cities = []
countries = set()
world_population = 0

# data from https://simplemaps.com/data/world-cities
file_name = "src/data/worldcities.csv"
with open(file_name, "r") as file:
    reader = csv.reader(file)
    try:
        for row in reader:
            if row[0] != "city" and row[9] != "":
                cities.append(row)
                world_population += int(float(row[9]))
                countries.add(row[4])
    except csv.Error as e:
        sys.exit("file {}, line {}: {}".format(file_name, reader.line_num, e))

config.check_config()
user_amount = 1000000
hashed_password = hash_password("password")
population_per_user = world_population / user_amount
meter_per_degree = 111111


def generate_city_users(city):
    with session_scope() as session:
        city_population = int(float(city[9]))
        city_radius = math.sqrt(city_population) * 10
        users_for_this_city = round(city_population / population_per_user)
        city_lat = float(city[2])
        city_long = float(city[3])
        for user_number in range(0, users_for_this_city):
            gender = random.choice(["Male", "Female"])
            username = fake.name_male() if gender == "Male" else fake.name_female()
            user_lat = city_lat + (2 * random.random() - 1) * city_radius / meter_per_degree
            user_long = city_long + (2 * random.random() - 1) * city_radius / meter_per_degree
            new_user = User(
                username=username.lower().replace(" ", "") + str(random.random()),
                email="generated_" + str(random.random()) + "@couchers.org",
                hashed_password=hashed_password,
                name=username,
                city=city[0] + ", " + city[4],
                geom=create_coordinate(user_lat, user_long),
                geom_radius=random.random() * city_radius / 10,
                verification=random.random(),
                community_standing=random.random(),
                birthdate=fake.date_between("-100y", "-15y"),
                gender=gender,
                languages=", ".join(set([fake.language_name() for _ in range(random.randrange(1, 6))])),
                occupation=fake.job(),
                about_me=fake.text(),
                about_place=fake.text(),
                color=fake.safe_color_name(),
                countries_visited="|".join(random.choices(list(countries), k=32)),
                countries_lived="|".join(random.choices(list(countries), k=8)),
                hosting_status=hostingstatus2sql[random.randint(1, 5)],
            )
            session.add(new_user)
        session.commit()


def generate_dummy_data():
    with multiprocessing.Pool(os.cpu_count() * 2) as pool:
        pool.map(generate_city_users, cities)


generate_dummy_data()
