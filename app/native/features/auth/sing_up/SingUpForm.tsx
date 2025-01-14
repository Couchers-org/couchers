import Sentry from "platform/sentry";
import { TextInput, Text, StyleSheet, Switch, View } from "react-native";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
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

export default function SingUpForm() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<{
    username: string;
    email: string;
  }>();

  const onSubmit = handleSubmit(
    async (data: { username: string; email: string }) => {
      setLoading(true);
      authActions.clearError();
      try {
        const sanitizedEmail = lowercaseAndTrimField(data.email);
        const sanitizedName = data.username.trim();
        const state = await service.auth.startSignup(
          sanitizedName,
          sanitizedEmail
        );
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
        {t("auth:basic_form.name.field_label")}
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
            placeholder={t("auth:basic_form.name.field_label")}
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
        {t("auth:basic_form.email.field_label")}
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
            placeholder={t("auth:basic_form.email.field_label")}
            onChangeText={onChange}
            value={value}
            autoComplete="email"
            onSubmitEditing={onSubmit}
          />
        )}
        name="email"
      />
      {errors.email && (
        <ThemedText type="error">
          {t("auth:basic_form.email.required_error")}
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
