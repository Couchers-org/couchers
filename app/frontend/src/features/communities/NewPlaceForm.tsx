import { Error as GrpcError } from "grpc-web";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { useHistory } from "react-router-dom";

import Alert from "../../components/Alert";
import Button from "../../components/Button";
import CircularProgress from "../../components/CircularProgress";
import EditLocationMap from "../../components/EditLocationMap";
import TextField from "../../components/TextField";
import { Page } from "../../pb/pages_pb";
import { service } from "../../service";
import ProfileMarkdownInput from "../profile/ProfileMarkdownInput";
import { pageURL } from "./redirect";

type NewPlaceInputs = {
  title: string;
  content: string;
  address: string;
  lat: number;
  lng: number;
};

export default function NewPlaceForm() {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    errors,
  } = useForm<NewPlaceInputs>({
    shouldUnregister: false,
    mode: "onBlur",
  });

  const history = useHistory();

  const {
    mutate: createPlace,
    isLoading: isCreateLoading,
    error: createError,
  } = useMutation<Page.AsObject, GrpcError, NewPlaceInputs>(
    ({ title, content, address, lat, lng }: NewPlaceInputs) =>
      service.pages.createPlace(title, content, address, lat, lng),
    {
      onSuccess: (page) => {
        history.push(pageURL(page));
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
            name="title"
            label="Place Title"
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
                label="Place content"
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
