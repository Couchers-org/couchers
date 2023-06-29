USERNAME = "aapeli"
# the default password when testing locally
PASSWORD = "Aapeli's password"

import couchers
import pytz
from datetime import datetime, timedelta

from google.protobuf.timestamp_pb2 import Timestamp
from couchers.proto import events_pb2, search_pb2
# from google.protobuf import empty_pb2

def Timestamp_from_datetime(dt: datetime):
    pb_ts = Timestamp()
    pb_ts.FromDatetime(dt)
    return pb_ts

def now():
    return datetime.now(pytz.UTC)

event_text = """Hey lovely Couchers,

Since I love boardgames I'm organising a virtual board games night. Feel free to bring your own boardgames! See you there!
"""

client = couchers.get_client(USERNAME, PASSWORD, server_address="localhost:8888", disable_tls=True)

date_now = now()

# res = client.search.Search(search_pb2.SearchReq(
#     query="new y",
#     include_communities=True,
#     title_only=True
# ))
# print(res.results)
# print(len(res.results))
for i in range(10):
    init_event = client.events.CreateEvent(events_pb2.CreateEventReq(
        title=f"Virtual Board Games Night {i + 1}",
        content=event_text,
        photo_key=None,
        online_information=events_pb2.OnlineEventInformation(
            link="http://coucher.org/board-games-night"
        ),
        parent_community_id=1,
        start_time=Timestamp_from_datetime(date_now + timedelta(hours=1, days=14 + i * 7, minutes=60 - date_now.minute)),
        end_time=Timestamp_from_datetime(date_now + timedelta(hours=3, days=15 + i * 7, minutes=60 - date_now.minute)),
        timezone="UTC"
    ))
    # print(init_event)

#     final_event = client.events.TransferEvent(events_pb2.TransferEventReq(
#         event_id=init_event.event_id,
#         new_owner_community_id=1
#     ))
    # print("=" * 50)
    # print(final_event)

# init_event = client.events.CreateEvent(events_pb2.CreateEventReq(
#     title=f"Virtual Board Games Night 9001",
#     content=event_text,
#     photo_key=None,
#     online_information=events_pb2.OnlineEventInformation(
#         link="http://coucher.org/board-games-night"
#     ),
#     parent_community_id=1,
#     start_time=Timestamp_from_datetime(date_now + timedelta(hours=1, days=1, minutes=60 - date_now.minute)),
#     end_time=Timestamp_from_datetime(date_now + timedelta(hours=3, days=1, minutes=60 - date_now.minute)),
#     timezone="UTC"
# ))
# print(init_event)

# final_event = client.events.TransferEvent(events_pb2.TransferEventReq(
#     event_id=init_event.event_id,
#     new_owner_community_id=1
# ))

# event = client.events.SetEventAttendance(events_pb2.SetEventAttendanceReq(
#     event_id=48,
#     attendance_state=events_pb2.AttendanceState.ATTENDANCE_STATE_GOING
# ))
# print(event)

# final_event = client.events.TransferEvent(events_pb2.TransferEventReq(
#     event_id=70,
#     new_owner_community_id=1
# ))