import logging
from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import datetime, timedelta
from io import BytesIO
from os import environ
from urllib.parse import urlencode

import backoff
import grpc
import pyvips
from couchers.crypto import generate_hash_signature, verify_hash_signature
from couchers.utils import Timestamp_from_datetime
from flask import Flask, abort, request
from pb import media_pb2, media_pb2_grpc

logger = logging.getLogger(__name__)

app = Flask(__name__)

# Config values

# hex-encoded secret key, used for signatures that  verify main & media server
# are talking to each other
MEDIA_SERVER_SECRET_KEY = bytes.fromhex(environ["MEDIA_SERVER_SECRET_KEY"])

# address of main server
MAIN_SERVER_ADDRESS = environ["MAIN_SERVER_ADDRESS"]

# whether to disable SSL
MAIN_SERVER_NO_SSL = environ.get("MAIN_SERVER_NO_SSL")
MAIN_SERVER_USE_SSL = MAIN_SERVER_NO_SSL is None

#call_creds = grpc.access_token_call_credentials(token)
#comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

@backoff.on_exception(backoff.expo, grpc.StatusCode.UNAVAILABLE, max_time=5)
def send_confirmation_to_main_server(key):
    if MAIN_SERVER_USE_SSL:
        channel = grpc.secure_channel(MAIN_SERVER_ADDRESS)
    else:
        logger.warning("Connecting to main server insecurely!")
        channel = grpc.insecure_channel(MAIN_SERVER_ADDRESS)

    media_stub = media_pb2_grpc.MediaStub(channel)
    req = media_pb2.UploadConfirmationReq(
        key=key,
    )
    media_stub.UploadConfirmation(req)

@app.route("/debug")
def debug():
    req = media_pb2.UploadRequest(
        key="testkey",
        type=media_pb2.UploadRequest.UploadType.IMAGE,
        created=Timestamp_from_datetime(datetime.utcnow()),
        expiry=Timestamp_from_datetime(datetime.utcnow() + timedelta(hours=1)),
        max_width=2000,
        max_height=1600,
    ).SerializeToString()

    data = urlsafe_b64encode(req).decode("utf8")
    sig = urlsafe_b64encode(generate_hash_signature(req, MEDIA_SERVER_SECRET_KEY)).decode("utf8")

    ret = {
        "data": data,
        "sig": sig,
    }

    return {
        "url": f"http://127.0.0.1:5000/upload?" + urlencode(ret),
        "data": data,
        "sig": sig,
    }

@app.route("/upload", methods=["POST"])
def upload():
    # TODO(aapeli): avoid replay attacks
    try:
        data = urlsafe_b64decode(request.args.get("data"))
        sig = urlsafe_b64decode(request.args.get("sig"))
    except Exception as e:
        abort(400, "Invalid data or signature")

    if not verify_hash_signature(data, MEDIA_SERVER_SECRET_KEY, sig):
        abort(400, "Invalid data or signature")

    req = media_pb2.UploadRequest.FromString(data)

    # proto timestamps are in UTC
    now = datetime.utcnow()

    if req.created.ToDatetime() > now:
        logger.warning("Got request from the future. Are the clocks out of sync?")

    if req.expiry.ToDatetime() < now:
        abort(400, "Request expired")

    request_file = request.files.get("file", None)

    if not request_file:
        abort(400, "No file provided")

    if req.type != media_pb2.UploadRequest.UploadType.IMAGE:
        abort(500, "Unsupported upload type.")

    # handle image uploads
    img = pyvips.Image.new_from_buffer(request_file.read(), options="", access="sequential")

    width = img.get("width")
    height = img.get("height")

    # if it's larger than allowed max values, resize it
    scale = min(req.max_width / width, req.max_height / height)
    if scale < 1:
        img = img.resize(scale)

    # strip removes EXIF and other metadata (e.g. GPS location)
    img.write_to_file(f"{req.key}.jpg", strip=True)

    # let the main server know the upload succeeded, or delete the file
    try:
        send_confirmation_to_main_server(req.key)
        return {"ok": True}
    except Exception as e:
        # TODO(aapeli): delete file here
        raise e
        return {"error": True}
