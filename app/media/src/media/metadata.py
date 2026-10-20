import io
import json
import logging
import traceback

import exifread
import pyvips

from media.proto import media_pb2

logger = logging.getLogger(__name__)

logging.getLogger("exifread").setLevel(logging.ERROR)

RAW_SEGMENTS = (
    ("exif-data", "exif"),
    ("xmp-data", "xmp"),
    ("iptc-data", "iptc"),
)


def _clean_filename(filename: str | None) -> str:
    return (filename or "").replace("\x00", "")


def _parse(image_bytes: bytes) -> tuple[str, str]:
    try:
        tags = exifread.process_file(io.BytesIO(image_bytes), extract_thumbnail=False)
    except Exception:
        logger.exception("Failed to parse image metadata")
        return "", traceback.format_exc().replace("\x00", "")

    if not tags:
        return "", ""

    return json.dumps({tag: str(value).replace("\x00", "") for tag, value in tags.items()}, sort_keys=True), ""


def extract_metadata(img: pyvips.Image, image_bytes: bytes, original_filename: str | None) -> media_pb2.UploadMetadata:
    fields = set(img.get_fields())

    segments = {name: bytes(img.get(field)) for field, name in RAW_SEGMENTS if field in fields}

    loader = img.get("vips-loader").removesuffix("load_buffer") if "vips-loader" in fields else ""

    parsed_json, parse_error = _parse(image_bytes)

    return media_pb2.UploadMetadata(
        parsed_json=parsed_json,
        parse_error=parse_error,
        original_filename=_clean_filename(original_filename),
        original_format=loader,
        original_size=len(image_bytes),
        original_width=img.get("width"),
        original_height=img.get("height"),
        **segments,
    )
