import csv
import sys
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

file_name = 'src/data/worldcities.csv'
with open(file_name, "r") as file:
    reader = csv.reader(file)
    try:
        for row in reader:
            if row[0] != 'city' and row[9] != '':
                print(row[0])
                cities.append(row)
                worldpopulation += int(float(row[9]))
                countries.add(row[4])
    except csv.Error as e:
        sys.exit('file {}, line {}: {}'.format(file_name, reader.line_num, e))

useramount = 1000000
users = []
hashedpassword = hash_password('MAGA2020')


def getsomecountries(k):
    return random.choices(list(countries), k=k)


config.check_config()

populationperuser = worldpopulation / useramount


def generate_dummy_data():
    try:
        with session_scope() as session:
            for city in cities:
                citypopulation = int(float(city[9]))
                usersforthiscity = round(citypopulation / populationperuser)
                citylat = float(city[2])
                citylong = float(city[3])
                for usernumber in range(0, usersforthiscity):
                    gender = random.choice(['Male', 'Female'])
                    username = fake.name_male() if gender == 'Male' else fake.name_female()
                    userlat = citylat + (random.random() - .5) / 10
                    userlong = citylong + (random.random() - .5) / 10
                    new_user = User(
                        username=username.lower().replace(' ', '') + str(random.random()),
                        email=username.lower().replace(' ', '') + '_' + str(usernumber) + '_' + str(
                            city[10]) + '@couchers.org',
                        hashed_password=hashedpassword,
                        name=username,
                        city=city[0] + ', ' + city[4],
                        geom=create_coordinate(userlat, userlong),
                        geom_radius=random.random() / 10,
                        verification=random.random(),
                        community_standing=random.random(),
                        birthdate=date(
                            year=random.randint(1920, 2005), month=random.randint(1, 12), day=random.randint(1, 28)
                        ),
                        gender=gender,
                        languages='English',
                        occupation="occupation",
                        about_me=fake.text(),
                        about_place=fake.text(),
                        color=fake.safe_color_name(),
                        countries_visited="|".join(getsomecountries(32)),
                        countries_lived="|".join(getsomecountries(8)),
                        hosting_status=hostingstatus2sql[random.randint(1, 5)]
                    )
                    session.add(new_user)
                    session.commit()

    except Exception as e:
        logger.error("Failed to insert dummy data", e)


generate_dummy_data()
