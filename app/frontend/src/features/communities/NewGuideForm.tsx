import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import EditLocationMap from "components/EditLocationMap";
import TextField from "components/TextField";
import { pageURL } from "features/communities/redirect";
import ProfileMarkdownInput from "features/profile/ProfileMarkdownInput";
import { Error as GrpcError } from "grpc-web";
import { Page } from "pb/pages_pb";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { useHistory } from "react-router-dom";
import { service } from "service/index";

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
    errors,
  } = useForm<NewGuideInputs>({
    mode: "onBlur",
    shouldUnregister: false,
  });

  const history = useHistory();

  const {
    mutate: createGuide,
    isLoading: isCreateLoading,
    error: createError,
  } = useMutation<Page.AsObject, GrpcError, NewGuideInputs>(
    ({ title, content, address, lat, lng }: NewGuideInputs) =>
      // TODO: parent community ID
      service.pages.createGuide(title, content, 1, address, lat, lng),
    {
      onSuccess: (page) => {
        history.push(pageURL(page));
      },
    }
  );

  const onSubmit = handleSubmit((data: NewGuideInputs) => createGuide(data));

  return (
    <>
      {createError && <Alert severity="error">{createError?.message}</Alert>}
      {isCreateLoading ? (
        <CircularProgress />
      ) : (
        <form onSubmit={onSubmit}>
          <TextField
            id="new-page-title"
            name="title"
            label="Page Title"
            inputRef={register({
              required: "Enter a page title",
            })}
            helperText={errors?.title?.message}
          />
          <Controller
            control={control}
            name="content"
            render={({ onChange, value }) => (
              <ProfileMarkdownInput
                label="Page content"
                onChange={onChange}
                value={value}
              />
            )}
          />

          <Controller
            name="address"
            control={control}
            render={({ value, onChange }) => (
              <EditLocationMap
                address={value}
                setAddress={(newValue) => onChange(newValue)}
                setLocation={(location) => {
                  setValue("lat", location.lat);
                  setValue("lng", location.lng);
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
