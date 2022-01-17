import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import EditLocationMap from "components/EditLocationMap";
import ImageInput from "components/ImageInput";
import TextField from "components/TextField";
import ProfileMarkdownInput from "features/profile/ProfileMarkdownInput";
import { RpcError } from "grpc-web";
import { useRouter } from "next/router";
import { Page, PageType } from "proto/pages_pb";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { routeToGuide, routeToPlace } from "routes";
import { service } from "service";

type NewPlaceInputs = {
  title: string;
  content: string;
  address: string;
  lat: number;
  lng: number;
  photoKey?: string;
};

export default function NewPlaceForm() {
  const { control, register, handleSubmit, setValue, errors } =
    useForm<NewPlaceInputs>({
      mode: "onBlur",
      shouldUnregister: false,
    });

  const router = useRouter();

  const {
    mutate: createPlace,
    isLoading: isCreateLoading,
    error: createError,
  } = useMutation<Page.AsObject, RpcError, NewPlaceInputs>(
    ({ title, content, address, lat, lng, photoKey }: NewPlaceInputs) =>
      service.pages.createPlace(title, content, address, lat, lng, photoKey),
    {
      onSuccess: (page) => {
        router.push(
          page.type === PageType.PAGE_TYPE_PLACE
            ? routeToPlace(page.pageId, page.slug)
            : routeToGuide(page.pageId, page.slug)
        );
      },
    }
  );

  const onSubmit = handleSubmit((data: NewPlaceInputs) => createPlace(data));

  return (
    <>
      {createError && <Alert severity="error">{createError?.message}</Alert>}
      {isCreateLoading ? (
        <CircularProgress />
      ) : (
        <form onSubmit={onSubmit}>
          <TextField
            id="new-place-title"
            name="title"
            label="Place Title"
            inputRef={register({
              required: "Enter a page title",
            })}
            helperText={errors?.title?.message}
          />
          <ImageInput
            type="rect"
            alt="Place photo"
            control={control}
            id="place-photo"
            name="photoKey"
          />
          <ProfileMarkdownInput
            id="content"
            label="Place content"
            control={control}
            name="content"
          />

          <Controller
            name="address"
            control={control}
            render={() => (
              <EditLocationMap
                exact
                updateLocation={(location) => {
                  if (location) {
                    // TODO: error handling
                    setValue("address", location.address);
                    setValue("lat", location.lat);
                    setValue("lng", location.lng);
                  }
                }}
              />
            )}
          />

          <Button onClick={onSubmit} loading={isCreateLoading}>
            Create page
          </Button>
        </form>
      )}
    </>
  );
}
