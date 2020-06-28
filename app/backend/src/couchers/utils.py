from google.protobuf.timestamp_pb2 import Timestamp
from datetime import datetime

def Timestamp_from_datetime(dt: datetime):
    pb_ts = Timestamp()
    pb_ts.FromDatetime(dt)
    return pb_ts
