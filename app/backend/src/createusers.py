import csv
import logging
import math
import multiprocessing
import os
import random
import sys

import faker

from couchers.crypto import hash_password
from couchers.db import session_scope
from couchers.models import User
from couchers.servicers.api import hostingstatus2sql
from couchers.utils import create_coordinate

fake = faker.Faker()

logger = logging.getLogger(__name__)

cities = []
countries = set()
world_population = 0

# data from https://simplemaps.com/data/world-cities
file_name = os.path.dirname(__file__) + "/data/worldcities.csv"
with open(file_name, "r") as file:
    reader = csv.reader(file)
    try:
        reader.__next__()
        for row in reader:
            if row[9] != "":
                cities.append(row)
                world_population += int(float(row[9]))
                countries.add(row[4])
    except csv.Error as e:
        sys.exit("file {}, line {}: {}".format(file_name, reader.line_num, e))

user_amount = 1000000
hashed_password = hash_password("password")
population_per_user = world_population / user_amount
meter_per_degree = 111111

batch_size = 1000
user_queue = multiprocessing.JoinableQueue(maxsize=10)
batch_queue = multiprocessing.JoinableQueue(maxsize=10)


def generate_city_users(city):
    city_population = int(float(city[9]))
    city_radius = math.sqrt(city_population) * 10
    users_for_this_city = round(city_population / population_per_user)
    city_lat = float(city[2])
    city_long = float(city[3])
    for user_number in range(0, users_for_this_city):
        gender = random.choice(["Male", "Female"])
        username = fake.name_male() if gender == "Male" else fake.name_female()
        user_lat = city_lat + random.uniform(-1, 1) * city_radius / meter_per_degree
        meter_per_degree_long = meter_per_degree * math.cos(math.radians(user_lat))
        user_long = city_long + random.uniform(-1, 1) * city_radius / meter_per_degree_long
        new_user = User(
            username=username.lower().replace(" ", "") + str(random.random()),
            email="generated_" + str(random.random()) + "@couchers.org",
            hashed_password=hashed_password,
            name=username,
            city=city[0] + ", " + city[4],
            geom=create_coordinate(user_lat, user_long),
            geom_radius=random.uniform(0, city_radius / 10),
            verification=random.random(),
            community_standing=random.random(),
            birthdate=fake.date_between("-100y", "-15y"),
            gender=gender,
            languages=", ".join(set([fake.language_name() for _ in range(random.randrange(6))])),
            occupation=fake.job(),
            about_me=fake.text(),
            about_place=fake.text(),
            color=fake.safe_color_name(),
            countries_visited="|".join(random.choices(list(countries), k=32)),
            countries_lived="|".join(random.choices(list(countries), k=8)),
            hosting_status=hostingstatus2sql[random.randint(1, 5)],
        )
        user_queue.put(new_user)


def reader_proc():
    with session_scope() as session:
        while True:
            users = batch_queue.get()
            if users is None:
                break
            else:
                session.add_all(users)
                session.commit()
            batch_queue.task_done()


def batch_proc():
    users = []
    while True:
        new_user = user_queue.get()
        user_queue.task_done()

        if new_user is None:
            batch_queue.put(users)
            break
        else:
            users.append(new_user)

        if len(users) >= batch_size:
            batch_queue.put(users)
            users = []
    batch_queue.join()


def generate_dummy_data():
    batch_process = multiprocessing.Process(target=batch_proc)
    batch_process.start()
    inserters = [multiprocessing.Process(target=reader_proc) for _ in range(8)]
    for inserter in inserters:
        inserter.start()
    with multiprocessing.Pool() as pool:
        pool.map(generate_city_users, cities)
        user_queue.join()
    user_queue.put(None)
    batch_process.join()
    user_queue.close()
    user_queue.join_thread()
    for _ in inserters:
        batch_queue.put(None)
    for inserter in inserters:
        inserter.join()
    batch_queue.close()
    batch_queue.join_thread()


generate_dummy_data()
