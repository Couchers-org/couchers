import logging
import os
from base64 import urlsafe_b64decode
from datetime import datetime
from pathlib import Path

import backoff
import grpc
import pyvips
from flask import Flask, abort, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

from media.crypto import verify_hash_signature
from pb import media_pb2, media_pb2_grpc

logger = logging.getLogger(__name__)


def create_app(
    media_server_secret_key: bytes,
    media_server_bearer_token: str,
    media_server_base_url: str,
    main_server_address: str,
    main_server_use_ssl: bool,
    media_upload_location: Path,
    thumbnail_size: int,
):

    # Create the directories
    media_upload_location.mkdir(exist_ok=True, parents=True)
    (media_upload_location / "full").mkdir(exist_ok=True, parents=True)
    (media_upload_location / "thumbnail").mkdir(exist_ok=True, parents=True)

    app = Flask(__name__)
    CORS(app)

    def get_path(filename, size="full"):
        return str(media_upload_location / size / filename)

    def _is_available(e):
        return e.code() != grpc.StatusCode.UNAVAILABLE

    @backoff.on_exception(backoff.expo, grpc.RpcError, max_time=1, giveup=_is_available)
    def send_confirmation_to_main_server(key, filename):
        logger.warning(f"Notifying main server about new upload at {main_server_address}")

        if main_server_use_ssl:
            channel = grpc.secure_channel(main_server_address, grpc.ssl_channel_credentials())
        else:
            logger.warning("Connecting to main server insecurely!")
            channel = grpc.insecure_channel(main_server_address)

        media_stub = media_pb2_grpc.MediaStub(channel)
        req = media_pb2.UploadConfirmationReq(
            key=key,
            filename=filename,
        )
        media_stub.UploadConfirmation(req, metadata=(("authorization", f"Bearer {media_server_bearer_token}"),))

    @app.route("/upload", methods=["POST"])
    def upload():
        try:
            data = urlsafe_b64decode(request.args.get("data"))
            sig = urlsafe_b64decode(request.args.get("sig"))
        except ValueError:
            abort(400, "Invalid data or signature")

        if not verify_hash_signature(data, media_server_secret_key, sig):
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
        try:
            img = pyvips.Image.new_from_buffer(request_file.read(), options="", access="sequential")
        except pyvips.Error:
            abort(400, "Invalid image")

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
            return {
                "ok": True,
                "key": req.key,
                "filename": filename,
                "full_url": f"{media_server_base_url}/img/full/{filename}",
                "thumbnail_url": f"{media_server_base_url}/img/thumbnail/{filename}",
            }
        except Exception as e:
            os.remove(path)
            raise e

    @app.route("/img/full/<key>.jpg")
    def full(key):
        path = get_path(key + ".jpg")
        if not os.path.isfile(path):
            abort(404, "Not found")

        return send_file(path, mimetype="image/jpeg", conditional=True)

    @app.route("/img/thumbnail/<key>.jpg")
    def thumbnail(key):
        filename = key + ".jpg"
        full_path = get_path(filename)
        if not os.path.isfile(full_path):
            abort(404, "Not found")

        thumbnail_path = get_path(filename, size="thumbnail")
        if not os.path.isfile(thumbnail_path):
            # generate the thumbnail...
            img = pyvips.Image.new_from_file(full_path, access="sequential")

            width = img.get("width")
            height = img.get("height")

            if width > height:
                size = height
                bar = (width - height) // 2
                img = img.crop(bar, 0, width - 2 * bar, height)
            else:
                size = width
                bar = (height - width) // 2
                img = img.crop(0, bar, width, height - 2 * bar)

            img = img.resize(thumbnail_size / size)
            img.write_to_file(thumbnail_path, strip=True)

        return send_file(thumbnail_path, mimetype="image/jpeg", conditional=True)

    return app


def create_app_from_env():
    # hex-encoded secret key, used for signatures that  verify main & media server
    # are talking to each other
    MEDIA_SERVER_SECRET_KEY = bytes.fromhex(os.environ["MEDIA_SERVER_SECRET_KEY"])

    MEDIA_SERVER_BEARER_TOKEN = os.environ["MEDIA_SERVER_BEARER_TOKEN"]

    # url prefix of images generated by this server
    MEDIA_SERVER_BASE_URL = os.environ["MEDIA_SERVER_BASE_URL"]

    # address of main server
    MAIN_SERVER_ADDRESS = os.environ["MAIN_SERVER_ADDRESS"]

    # whether to disable SSL, optional
    MAIN_SERVER_USE_SSL = os.environ.get("MAIN_SERVER_USE_SSL", "1") == "1"

    MEDIA_UPLOAD_LOCATION = Path(os.environ["MEDIA_UPLOAD_LOCATION"])

    THUMBNAIL_SIZE = 200

    return create_app(
        MEDIA_SERVER_SECRET_KEY,
        MEDIA_SERVER_BEARER_TOKEN,
        MEDIA_SERVER_BASE_URL,
        MAIN_SERVER_ADDRESS,
        MAIN_SERVER_USE_SSL,
        MEDIA_UPLOAD_LOCATION,
        THUMBNAIL_SIZE,
    )


if os.environ.get("MEDIA_SERVER_FROM_ENV", "0") == "1":
    app = create_app_from_env()

    if __name__ == "__main__":
        app.run()
