import logging
from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import datetime, timedelta
from io import BytesIO
from os import environ
from urllib.parse import urlencode

import pyvips
from couchers.crypto import generate_hash_signature, verify_hash_signature
from couchers.utils import Timestamp_from_datetime
from flask import Flask, abort, request
from pb import media_pb2

logger = logging.getLogger(__name__)

app = Flask(__name__)

MEDIA_SERVER_SECRET_KEY = environ.get("MEDIA_SERVER_SECRET_KEY")
if not MEDIA_SERVER_SECRET_KEY:
    raise ValueError("Need MEDIA_SERVER_SECRET_KEY")

KEY_BYTES = MEDIA_SERVER_SECRET_KEY.encode("utf8")

@app.route("/debug")
def debug():
    req = media_pb2.UploadRequest(
        key="testkey",
        created=Timestamp_from_datetime(datetime.utcnow()),
        expiry=Timestamp_from_datetime(datetime.utcnow() + timedelta(hours=1)),
        max_width=2000,
        max_height=1600,
    ).SerializeToString()

    data = urlsafe_b64encode(req).decode("utf8")
    sig = urlsafe_b64encode(generate_hash_signature(req, KEY_BYTES)).decode("utf8")

    ret = {
        "data": data,
        "sig": sig,
    }

    return {
        "url": "http://127.0.0.1:5000/upload?" + urlencode(ret),
        "data": data,
        "sig": sig,
    }

@app.route("/upload", methods=["POST"])
def upload():
    try:
        data = urlsafe_b64decode(request.args.get("data"))
        sig = urlsafe_b64decode(request.args.get("sig"))
    except Exception as e:
        abort(400, "Invalid data or signature")

    if not verify_hash_signature(data, KEY_BYTES, sig):
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
        # TODO(aapeli)
        pass
    except Exception as e:
        return {"error": True}

    return {"ok": True}
