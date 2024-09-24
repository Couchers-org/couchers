import Sentry from "platform/sentry";
import { TextInput, Text, StyleSheet, Switch, View } from "react-native";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import isGrpcError from "service/utils/isGrpcError";
import { lowercaseAndTrimField } from "utils/validation";
import Button from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { Trans } from "react-i18next";
import * as Linking from "expo-linking";
import Link from "@/components/Link";
import { service } from "@/service";
import Alert from "@/components/Alert";
import { HostingStatus } from "@/proto/api_pb";
import { Picker } from "@react-native-picker/picker";

// TODO we should put this type in proper place
interface ApproximateLocation {
  address: string;
  lat: number;
  lng: number;
  radius: number;
}

type SignupAccountInputs = {
  username: string;
  password: string;
  name: string;
  birthdate: Date;
  gender: string;
  acceptTOS: boolean;
  optInToNewsletter: boolean;
  hostingStatus: HostingStatus;
  location: ApproximateLocation;
};

export default function AccountForm() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignupAccountInputs>();

  const onSubmit = handleSubmit(
    async ({
      username,
      password,
      birthdate,
      gender,
      acceptTOS,
      optInToNewsletter,
      hostingStatus,
      location,
    }: SignupAccountInputs) => {
      setLoading(true);
      authActions.clearError();
      try {
        const state = await service.auth.signupFlowAccount({
          flowToken: undefined,
          username: 'test123',
          password: 'testtest',
          birthdate: new Date(1899, 12, 1).toISOString().split("T")[0],
          gender: 'male',
          acceptTOS: true,
          optOutOfNewsletter: false,
          hostingStatus: HostingStatus.HOSTING_STATUS_CANT_HOST,
          city: 'London',
          lat: 51.5074,
          lng: 0.1278,
          radius: 10,
        });
        return authActions.updateSignupState(state);
      } catch (e) {
        console.log("error ", e);
        Sentry.captureException(e, {
          tags: {
            featureArea: "auth/login",
          },
        });
        authActions.authError(
          isGrpcError(e) ? e.message : t("global:error.fatal_message")
        );
      }
      setLoading(false);
    }
  );

  return (
    <>
      <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
        {t("auth:account_form.username.field_label")}
      </ThemedText>
      <Controller
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            autoCapitalize="none"
            style={styles.input}
            onBlur={onBlur}
            placeholder={t("auth:account_form.username.field_label")}
            onChangeText={onChange}
            value={value}
            autoComplete="username"
          />
        )}
        name="username"
      />
      {errors.username && (
        <ThemedText type="error">
          {t("auth:basic_form.name.required_error")}
        </ThemedText>
      )}

      <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
        {t("auth:account_form.password.field_label")}
      </ThemedText>
      <Controller
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            autoCapitalize="none"
            style={styles.input}
            onBlur={onBlur}
            placeholder={t("auth:account_form.password.field_label")}
            onChangeText={onChange}
            value={value}
            autoComplete="email"
            onSubmitEditing={onSubmit}
          />
        )}
        name="password"
      />
      {errors.password && (
        <ThemedText type="error">
          {t("auth:basic_form.email.required_error")}
        </ThemedText>
      )}

      <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
        {t("auth:account_form.hosting_status.field_label")}
      </ThemedText>
      <Controller
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Picker selectedValue={value} onValueChange={onChange}>
            <Picker.Item
              label={t("auth:account_form.hosting_status.can_host")}
              value="Can host"
            />
            <Picker.Item
              label={t("auth:account_form.hosting_status.cant_host")}
              value="Can't host"
            />
            <Picker.Item
              label={t("auth:account_form.hosting_status.maybe")}
              value="Maybe"
            />
          </Picker>
        )}
        name="hostingStatus"
      />
      {errors.hostingStatus && (
        <ThemedText type="error">
          {t("auth:account_form.hosting_status.required_error")}
        </ThemedText>
      )}

      {authState.error && <Alert>{authState.error}</Alert>}

      {/* <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
        {t("auth:sign_up_page.form.confirm_password_field_label")}
      </ThemedText>
      <Controller
        control={control}
        rules={{
          required: true,
          validate: (value) => value === watch("password"),
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            onBlur={onBlur}
            placeholder={t("auth:sign_up_page.form.password_field_placeholder")}
            onChangeText={onChange}
            value={value}
            autoComplete="current-password"
            secureTextEntry={true}
            onSubmitEditing={onSubmit}
          />
        )}
        name="confirmPassword"
      />
      {errors.confirmPassword?.type === "required" && (
        <ThemedText type="error">
          {t("auth:sign_up_page.form.confirm_password_required_error")}
        </ThemedText>
      )}
      {errors.confirmPassword?.type === "validate" && (
        <ThemedText type="error">
          {t("auth:sign_up_page.form.confirm_password_validation_error")}
        </ThemedText>
      )} */}

      <Button
        filled={true}
        disabled={loading || authLoading}
        onPress={onSubmit}
        title={t("global:continue")}
      />
      <ThemedText>
        <Trans
          i18nKey="auth:sign_up_page.form.tos_agreement_explainer"
          components={{
            1: (
              <Link
                onPress={() => Linking.openURL("https://couchers.org/terms")}
              />
            ),
            2: (
              <Link
                onPress={() => Linking.openURL("https://couchers.org/terms")}
              />
            ), // TODO, what the link to code of conduct?
          }}
        />
      </ThemedText>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderBottomColor: "gray",
    borderBottomWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  inputLabel: {
    marginBottom: 4,
  },
});
