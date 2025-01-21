import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import EditLocationMap from "components/EditLocationMap";
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

type NewGuideInputs = {
  title: string;
  content: string;
  address: string;
  lat?: number;
  lng?: number;
};

export default function NewGuideForm() {
  const {
    control,
    register,
    handleSubmit,
    setValue,

    formState: { errors },
  } = useForm<NewGuideInputs>({
    mode: "onBlur",
    shouldUnregister: false,
  });

  const router = useRouter();

  const {
    mutate: createGuide,
    isLoading: isCreateLoading,
    error: createError,
  } = useMutation<Page.AsObject, RpcError, NewGuideInputs>(
    ({ title, content, address, lat, lng }: NewGuideInputs) =>
      // TODO: parent community ID
      service.pages.createGuide(title, content, 1, address, lat, lng),
    {
      onSuccess: (page) => {
        router.push(
          page.type === PageType.PAGE_TYPE_PLACE
            ? routeToPlace(page.pageId, page.slug)
            : routeToGuide(page.pageId, page.slug),
        );
      },
    },
  );

  const onSubmit = handleSubmit((data: NewGuideInputs) => createGuide(data));

  return (
    <>
      {createError && <Alert severity="error">{createError?.message}</Alert>}
      {isCreateLoading ? (
        <CenteredSpinner />
      ) : (
        <form onSubmit={onSubmit}>
          <TextField
            id="new-page-title"
            {...register("title", {
              required: "Enter a page title",
            })}
            label="Page Title"
            helperText={errors?.title?.message}
          />
          <ProfileMarkdownInput
            id="content"
            name="content"
            label="Page content"
            control={control}
          />

          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <EditLocationMap
                {...field}
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
