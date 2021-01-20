import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useHistory, useLocation } from "react-router-dom";
import Button from "../../components/Button";
import CircularProgress from "../../components/CircularProgress";
import TextField from "../../components/TextField";
import { useAppDispatch } from "../../store";
import Alert from "../../components/Alert";
import { createPage } from "./actions"
import ProfileMarkdownInput from "../profile/ProfileMarkdownInput";
import EditLocationMap from "../../components/EditLocationMap";
import { unwrapResult } from "@reduxjs/toolkit";
import { pageRoute } from "../../AppRoutes";
import { Page } from "../../pb/pages_pb"

type NewPageInputs = {
  title: string;
  content: string;
  address: string;
  lat: number;
  lng: number;
};

export default function CompleteSignup() {
  const dispatch = useAppDispatch();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    errors,
    getValues,
  } = useForm<NewPageInputs>({
    shouldUnregister: false,
    mode: "onBlur",
  });

  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const history = useHistory();

  const [alertState, setShowAlertState] = useState<
    "success" | "error" | undefined
  >();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitForm = handleSubmit(async (data: NewPageInputs) => {
    try {
      const page = unwrapResult(await dispatch(createPage(data))) as Page.AsObject;
      setShowAlertState("success");
      history.push(`${pageRoute}/${page.pageId}/${page.slug}`);
    } catch (error) {
      console.error(error)
      setShowAlertState("error");
      setErrorMessage(error.message);
    }
  });

  return (
    <>
      {alertState === "success" ? (
        <Alert severity={alertState}>Successfully created page!</Alert>
      ) : alertState === "error" ? (
        <Alert severity={alertState}>{errorMessage}</Alert>
      ) : null}
      {loading ? (
        <CircularProgress />
      ) : (
        <form onSubmit={submitForm}>
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

          <Button onClick={submitForm} loading={loading}>
            Create page
          </Button>
        </form>
      )}
    </>
  );
}
