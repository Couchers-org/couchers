import {
  AddPhotoToGalleryReq,
  GetGalleryEditInfoReq,
  GetGalleryReq,
  MovePhotoReq,
  RemovePhotoFromGalleryReq,
  UpdatePhotoCaptionReq,
} from "couchers/proto/galleries_pb";

import client from "./client";

/**
 * Get a gallery by ID
 */
export async function getGallery(galleryId: number) {
  const req = new GetGalleryReq();
  req.setGalleryId(galleryId);

  const response = await client.galleries.getGallery(req);
  return response.toObject();
}

/**
 * Get edit info for a gallery (only available to gallery owner)
 */
export async function getGalleryEditInfo(galleryId: number) {
  const req = new GetGalleryEditInfoReq();
  req.setGalleryId(galleryId);

  const response = await client.galleries.getGalleryEditInfo(req);
  return response.toObject();
}

/**
 * Add a photo to a gallery
 */
export async function addPhotoToGallery(
  galleryId: number,
  uploadKey: string,
  caption?: string,
) {
  const req = new AddPhotoToGalleryReq();
  req.setGalleryId(galleryId);
  req.setUploadKey(uploadKey);

  if (caption) {
    req.setCaption(caption);
  }

  const response = await client.galleries.addPhotoToGallery(req);
  return response.toObject();
}

/**
 * Remove a photo from a gallery
 */
export async function removePhotoFromGallery(
  galleryId: number,
  itemId: number,
) {
  const req = new RemovePhotoFromGalleryReq();
  req.setGalleryId(galleryId);
  req.setItemId(itemId);

  const response = await client.galleries.removePhotoFromGallery(req);
  return response.toObject();
}

/**
 * Move a photo to a new position in the gallery
 * @param afterItemId - ID of the photo to place after, or 0 to move to first position
 */
export async function movePhoto(
  galleryId: number,
  itemId: number,
  afterItemId: number,
) {
  const req = new MovePhotoReq();
  req.setGalleryId(galleryId);
  req.setItemId(itemId);
  req.setAfterItemId(afterItemId);

  const response = await client.galleries.movePhoto(req);
  return response.toObject();
}

/**
 * Update the caption of a photo
 */
export async function updatePhotoCaption(
  galleryId: number,
  itemId: number,
  caption: string,
) {
  const req = new UpdatePhotoCaptionReq();
  req.setGalleryId(galleryId);
  req.setItemId(itemId);
  req.setCaption(caption);

  const response = await client.galleries.updatePhotoCaption(req);
  return response.toObject();
}
