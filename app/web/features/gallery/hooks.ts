import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { galleryEditInfoKey, galleryKey } from "features/queryKeys";
import { service } from "service";

export function useGallery(galleryId: number) {
  return useQuery({
    queryKey: galleryKey(galleryId),
    queryFn: () => service.gallery.getGallery(galleryId),
  });
}

export function useGalleryEditInfo(galleryId: number, enabled = true) {
  return useQuery({
    queryKey: galleryEditInfoKey(galleryId),
    queryFn: () => service.gallery.getGalleryEditInfo(galleryId),
    enabled,
  });
}

export function useAddPhotoToGallery(galleryId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uploadKey,
      caption,
    }: {
      uploadKey: string;
      caption?: string;
    }) => service.gallery.addPhotoToGallery(galleryId, uploadKey, caption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKey(galleryId) });
      queryClient.invalidateQueries({
        queryKey: galleryEditInfoKey(galleryId),
      });
    },
  });
}

export function useRemovePhotoFromGallery(galleryId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) =>
      service.gallery.removePhotoFromGallery(galleryId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKey(galleryId) });
      queryClient.invalidateQueries({
        queryKey: galleryEditInfoKey(galleryId),
      });
    },
  });
}

export function useUpdatePhotoCaption(galleryId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, caption }: { itemId: number; caption: string }) =>
      service.gallery.updatePhotoCaption(galleryId, itemId, caption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKey(galleryId) });
    },
  });
}

export function useMovePhoto(galleryId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      afterItemId,
    }: {
      itemId: number;
      afterItemId: number;
    }) => service.gallery.movePhoto(galleryId, itemId, afterItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKey(galleryId) });
    },
  });
}
