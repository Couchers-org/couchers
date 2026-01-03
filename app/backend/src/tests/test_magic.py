from datetime import datetime
from typing import Any

from couchers.models import PhotoGallery, PhotoGalleryItem, Upload


def make_photogalleryitem(
    *,
    gallery: int | PhotoGallery,
    upload: str | Upload,
    position: float,
    caption: str | None = None,
    created: datetime | None = None,
) -> PhotoGalleryItem:
    kwargs: dict[str, Any] = {}
    if isinstance(gallery, PhotoGallery):
        kwargs["gallery_id"] = gallery.id
    else:
        kwargs["gallery_id"] = gallery
    if isinstance(upload, Upload):
        kwargs["upload_key"] = upload.key
    else:
        kwargs["upload_key"] = upload
    kwargs["position"] = position
    if caption is not None:
        kwargs["caption"] = caption
    if created is not None:
        kwargs["created"] = created

    return PhotoGalleryItem(**kwargs)


def test_x():
    make_photogalleryitem(gallery=1, upload="dog", position=1.0, created=datetime(2020, 6, 1))
