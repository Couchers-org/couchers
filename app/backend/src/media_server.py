from flask import Flask, abort, request
from io import BytesIO
import pyvips

app = Flask(__name__)

MAX_WIDTH = 2000
MAX_HEIGHT = 1600

@app.route("/upload", methods=["POST"])
def upload():
    request_file = request.files.get("file", None)

    if not request_file:
        abort(400, "No file provided")

    img = pyvips.Image.new_from_buffer(request_file.read(), options="", access="sequential")

    width = img.get("width")
    height = img.get("height")

    scale = min(MAX_WIDTH / width, MAX_HEIGHT / height)

    if scale < 1:
        img = img.resize(scale)

    # strip removes EXIF and other metadata (e.g. GPS location)
    img.write_to_file("test.jpg", strip=True)
    return "bye"
