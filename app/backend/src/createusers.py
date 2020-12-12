import csv
import sys
import math
from random import random
from couchers.models import (
    Base,
    Conversation,
    FriendRelationship,
    FriendStatus,
    GroupChat,
    GroupChatRole,
    GroupChatSubscription,
    Message,
    MessageType,
    Reference,
    ReferenceType,
    User,
)
from couchers import config

import random
from couchers.crypto import hash_password
from couchers.servicers.api import hostingstatus2sql
from couchers.utils import Timestamp_from_datetime, create_coordinate
from pb.api_pb2 import _HOSTINGSTATUS
from datetime import date
from couchers.db import get_user_by_field, session_scope
import logging
from faker import Faker

fake = Faker()

logger = logging.getLogger(__name__)

cities = []
countries = set()
worldpopulation = 0

# data from https://simplemaps.com/data/world-cities
file_name = 'src/data/worldcities.csv'
with open(file_name, "r") as file:
    reader = csv.reader(file)
    try:
        for row in reader:
            if row[0] != 'city' and row[9] != '':
                cities.append(row)
                worldpopulation += int(float(row[9]))
                countries.add(row[4])
    except csv.Error as e:
        sys.exit('file {}, line {}: {}'.format(file_name, reader.line_num, e))

useramount = 1000000
users = []
hashedpassword = hash_password('password')


def getsomecountries(k):
    return random.choices(list(countries), k=k)

config.check_config()

populationperuser = worldpopulation / useramount
meterperdegree = 111111


def generate_dummy_data():
    try:
        with session_scope() as session:
            for city in cities:
                citypopulation = int(float(city[9]))
                cityradius = math.sqrt(citypopulation) * 10
                usersforthiscity = round(citypopulation / populationperuser)
                citylat = float(city[2])
                citylong = float(city[3])
                for usernumber in range(0, usersforthiscity):
                    gender = random.choice(['Male', 'Female'])
                    username = fake.name_male() if gender == 'Male' else fake.name_female()
                    userlat = citylat + (2 * random.random() - 1) * cityradius / meterperdegree
                    userlong = citylong + (2 * random.random() - 1) * cityradius / meterperdegree
                    new_user = User(
                        username=username.lower().replace(' ', '') + str(random.random()),
                        email=username.lower().replace(' ', '') + '_' + str(random.random()) + '@couchers.org',
                        hashed_password=hashedpassword,
                        name=username,
                        city=city[0] + ', ' + city[4],
                        geom=create_coordinate(userlat, userlong),
                        geom_radius=random.random() * cityradius / 10,
                        verification=random.random(),
                        community_standing=random.random(),
                        birthdate=fake.date_between('-100y', '-15y'),
                        gender=gender,
                        languages=', '.join(set([fake.language_name() for i in range(random.randrange(4))])),
                        occupation=fake.job(),
                        about_me=fake.text(),
                        about_place=fake.text(),
                        color=fake.safe_color_name(),
                        countries_visited="|".join(getsomecountries(32)),
                        countries_lived="|".join(getsomecountries(8)),
                        hosting_status=hostingstatus2sql[random.randint(1, 5)]
                    )
                    users.append(new_user)
                    if len(users) == 10000:
                        session.add_all(users)
                        users.clear()
                        session.commit()
            if len(users) > 0:
                session.add_all(users)
                session.commit()

    except Exception as e:
        logger.error("Failed to insert dummy data", e)


generate_dummy_data()
