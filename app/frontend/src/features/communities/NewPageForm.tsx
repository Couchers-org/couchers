import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { useMutation } from "react-query";
import { Error as GrpcError } from "grpc-web";
import Button from "../../components/Button";
import CircularProgress from "../../components/CircularProgress";
import TextField from "../../components/TextField";
import Alert from "../../components/Alert";
import ProfileMarkdownInput from "../profile/ProfileMarkdownInput";
import EditLocationMap from "../../components/EditLocationMap";
import { pageRoute } from "../../AppRoutes";
import { Page } from "../../pb/pages_pb"
import { service } from "../../service";

type NewPageInputs = {
  title: string;
  content: string;
  address: string;
  lat: number;
  lng: number;
};

export default function CompleteSignup() {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    errors,
  } = useForm<NewPageInputs>({
    shouldUnregister: false,
    mode: "onBlur",
  });

  const history = useHistory();

  const [alertState, setShowAlertState] = useState<
    "success" | "error" | undefined
  >();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    mutate: createPage,
    isLoading: isCreateLoading,
  } = useMutation<Page.AsObject, GrpcError, NewPageInputs>(
    ({title, content, address, lat, lng}: NewPageInputs) => service.pages.createPage(title, content, address, lat, lng),
    {
      onSuccess: (page) => {
      setShowAlertState("success");
      history.push(`${pageRoute}/${page.pageId}/${page.slug}`);
    },
      onError: (error) => {
        console.error(error)
        setShowAlertState("error");
        setErrorMessage(error.message);
      }
    }
  );

  const onSubmit = handleSubmit((data: NewPageInputs) =>
    createPage(data)
  );

  return (
    <>
      {alertState && <Alert severity={alertState}>{errorMessage || "Successfully created page!"}</Alert>}
      {isCreateLoading ? (
        <CircularProgress />
      ) : (
        <form onSubmit={onSubmit}>
          <TextField
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
