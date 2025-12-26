import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { galleryEditInfoKey, galleryKey, userKey } from "features/queryKeys";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { PhotoGallery } from "proto/galleries_pb";
import { service } from "service";

export function useGallery(galleryId: number | undefined) {
  return useQuery({
    queryKey: galleryKey(galleryId || 0),
    queryFn: () => service.gallery.getGallery(galleryId!),
    enabled: !!galleryId && galleryId > 0,
  });
}

export function useGalleryEditInfo(galleryId: number | undefined) {
  return useQuery({
    queryKey: galleryEditInfoKey(galleryId || 0),
    queryFn: () => service.gallery.getGalleryEditInfo(galleryId!),
    enabled: !!galleryId && galleryId > 0,
  });
}

export function useAddPhotoToGallery(galleryId: number) {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: ({
      uploadKey,
      caption,
    }: {
      uploadKey: string;
      caption?: string;
    }) => service.gallery.addPhotoToGallery(galleryId, uploadKey, caption),
    onSuccess: (updatedGallery) => {
      queryClient.setQueryData(galleryKey(galleryId), updatedGallery);
      queryClient.invalidateQueries({
        queryKey: galleryEditInfoKey(galleryId),
      });
      // Invalidate user query to update avatar
      if (user?.userId) {
        queryClient.invalidateQueries({
          queryKey: userKey(user.userId),
        });
      }
    },
  });
}

export function useRemovePhotoFromGallery(galleryId: number) {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: (itemId: number) =>
      service.gallery.removePhotoFromGallery(galleryId, itemId),
    onSuccess: (updatedGallery) => {
      queryClient.setQueryData(galleryKey(galleryId), updatedGallery);
      queryClient.invalidateQueries({
        queryKey: galleryEditInfoKey(galleryId),
      });
      // Invalidate user query to update avatar
      if (user?.userId) {
        queryClient.invalidateQueries({
          queryKey: userKey(user.userId),
        });
      }
    },
  });
}

export function useMovePhoto(galleryId: number) {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: ({
      itemId,
      afterItemId,
    }: {
      itemId: number;
      afterItemId: number;
    }) => service.gallery.movePhoto(galleryId, itemId, afterItemId),
    onSuccess: (updatedGallery) => {
      queryClient.setQueryData(galleryKey(galleryId), updatedGallery);
      // Invalidate user query to update avatar
      if (user?.userId) {
        queryClient.invalidateQueries({
          queryKey: userKey(user.userId),
        });
      }
    },
  });
}

export function useUpdatePhotoCaption(galleryId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, caption }: { itemId: number; caption: string }) =>
      service.gallery.updatePhotoCaption(galleryId, itemId, caption),
    onSuccess: (updatedGallery) => {
      queryClient.setQueryData(galleryKey(galleryId), updatedGallery);
    },
  });
}

// Type for the gallery object from proto
export type GalleryData = PhotoGallery.AsObject;
export type GalleryItemData = PhotoGallery.AsObject["photosList"][number];
