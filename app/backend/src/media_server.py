import logging
import os
from base64 import urlsafe_b64decode
from datetime import datetime

import backoff
import grpc
import pyvips
from couchers.crypto import verify_hash_signature
from flask import Flask, abort, request, send_file
from flask_cors import CORS
from pb import media_pb2, media_pb2_grpc
from werkzeug.utils import secure_filename

# hex-encoded secret key, used for signatures that  verify main & media server
# are talking to each other
MEDIA_SERVER_SECRET_KEY = bytes.fromhex(os.environ["MEDIA_SERVER_SECRET_KEY"])

MEDIA_SERVER_BEARER_TOKEN = os.environ["MEDIA_SERVER_BEARER_TOKEN"]

# address of main server
MAIN_SERVER_ADDRESS = os.environ["MAIN_SERVER_ADDRESS"]

# whether to disable SSL, optional
MAIN_SERVER_USE_SSL = os.environ.get("MAIN_SERVER_USE_SSL", "1") == "1"

MEDIA_UPLOAD_LOCATION = os.environ["MEDIA_UPLOAD_LOCATION"]


AVATAR_SIZE = 200

logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

token_creds = grpc.access_token_call_credentials(MEDIA_SERVER_BEARER_TOKEN)
if MAIN_SERVER_USE_SSL:
    comp_creds = grpc.composite_channel_credentials(grpc.ssl_channel_credentials(), token_creds)
else:
    logger.warning("Connecting to main server insecurely!")
    comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), token_creds)

def get_path(filename, size="full"):
    return MEDIA_UPLOAD_LOCATION + ("/" if MEDIA_UPLOAD_LOCATION[-1] != "/" else "") + size + "/" + filename

def _is_available(e):
    return e.code() != grpc.StatusCode.UNAVAILABLE

@backoff.on_exception(backoff.expo, grpc.RpcError, max_time=5, giveup=_is_available)
def send_confirmation_to_main_server(key, filename):
    with grpc.secure_channel(MAIN_SERVER_ADDRESS, comp_creds) as channel:
        media_stub = media_pb2_grpc.MediaStub(channel)
        req = media_pb2.UploadConfirmationReq(
            key=key,
            filename=filename,
        )
        media_stub.UploadConfirmation(req)

@app.route("/upload", methods=["POST"])
def upload():
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

    if req.key != secure_filename(req.key):
        # just a sanity check
        abort(500, "Invalid key")

    filename = req.key + ".jpg"
    path = get_path(filename)

    if os.path.isfile(path):
        abort(400, "Invalid request")

    request_file = request.files.get("file", None)

    if not request_file:
        abort(400, "No file provided")

    if req.type != media_pb2.UploadRequest.UploadType.IMAGE:
        abort(500, "Unsupported upload type")

    # handle image uploads
    img = pyvips.Image.new_from_buffer(request_file.read(), options="", access="sequential")

    width = img.get("width")
    height = img.get("height")

    # if it's larger than allowed max values, resize it
    scale = min(req.max_width / width, req.max_height / height)
    if scale < 1:
        img = img.resize(scale)

    # strip removes EXIF (e.g. GPS location) and other metadata
    img.write_to_file(path, strip=True)

    # let the main server know the upload succeeded, or delete the file
    try:
        send_confirmation_to_main_server(req.key, filename)
        return {"ok": True}
    except Exception as e:
        os.remove(path)
        raise e

@app.route("/full/<key>.jpg")
def full(key):
    path = get_path(key + ".jpg")
    if not os.path.isfile(path):
        abort(404, "Not found")

    return send_file(open(path, "rb"), mimetype="image/jpeg")

@app.route("/avatar/<key>.jpg")
def avatar(key):
    filename = key + ".jpg"
    full_path = get_path(filename)
    if not os.path.isfile(full_path):
        abort(404, "Not found")

    avatar_path = get_path(filename, size="avatar")
    if not os.path.isfile(avatar_path):
        # generate the avatar...
        img = pyvips.Image.new_from_file(full_path, access="sequential")

        width = img.get("width")
        height = img.get("height")

        if width > height:
            size = height
            bar = (width - height) // 2
            img = img.crop(bar, 0, width - 2 * bar, height)
        else:
            size = width
            bar = (width - height) // 2
            img = img.crop(0, bar, width, height - 2 * bar)

        img = img.resize(AVATAR_SIZE / size)
        img.write_to_file(avatar_path, strip=True)

    return send_file(open(avatar_path, "rb"), mimetype="image/jpeg")
