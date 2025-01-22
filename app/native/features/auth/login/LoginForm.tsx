import Sentry from "platform/sentry";
import { TextInput, Text, StyleSheet, Switch, View } from "react-native";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import isGrpcError from "service/utils/isGrpcError";
import { lowercaseAndTrimField } from "utils/validation";
import { router } from "expo-router";
import Button from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { Trans } from "react-i18next";
import * as Linking from "expo-linking";
import Link from "@/components/Link";
import Alert from "@/components/Alert";

export default function LoginForm() {
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
    password: string;
    rememberDevice: boolean;
  }>();

  useEffect(() => {
    if (authState.error == null && authState.authenticated) {
      router.replace(`/(app)/explore` as any);
    }
  }, [authState.error, authState.authenticated]);

  const onSubmit = handleSubmit(
    async (data: {
      username: string;
      password: string;
      rememberDevice: boolean;
    }) => {
      setLoading(true);
      authActions.clearError();
      try {
        await authActions.passwordLogin({
          username: lowercaseAndTrimField(data.username),
          password: data.password,
          rememberDevice: data.rememberDevice,
        });
      } catch (e) {
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
        {t("auth:login_page.form.username_field_label")}
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
            placeholder={t("auth:login_page.form.username_field_label")}
            onChangeText={onChange}
            value={value}
            autoComplete="username"
          />
        )}
        name="username"
      />
      {errors.username && <Text>This is required.</Text>}

      <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
        {t("auth:login_page.form.password_field_label")}
      </ThemedText>
      <Controller
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            onBlur={onBlur}
            placeholder={t("auth:login_page.form.password_field_label")}
            onChangeText={onChange}
            value={value}
            autoComplete="current-password"
            secureTextEntry={true}
            onSubmitEditing={onSubmit}
          />
        )}
        name="password"
      />
      {errors.password && <Text>This is required.</Text>}
      {authState.error && <Alert>{authState.error}</Alert>}

      <Controller
        control={control}
        name="rememberDevice"
        defaultValue={true}
        render={({ field: { onChange, value } }) => (
          <View style={styles.switchContainer}>
            <Switch
              trackColor={{ false: "#E6EBEA", true: "#E6EBEA" }}
              thumbColor={value ? "#00A398" : "#00A398"}
              ios_backgroundColor="#E6EBEA"
              onValueChange={onChange}
              value={value}
              style={styles.switch}
            />
            <ThemedText>
              {t("auth:login_page.form.remember_me")}
            </ThemedText>
          </View>
        )}
      />
      <Button
        filled={true}
        disabled={loading || authLoading}
        onPress={onSubmit}
        title={t("global:continue")}
      />
      <ThemedText>
        <Trans
          i18nKey="auth:login_page.reset_password_prompt"
          components={{
            1: <Link onPress={() => Linking.openURL("https://couchers.org")} />,
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
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "flex-start",
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    marginRight: 10,
  },
  inputLabel: {
    marginBottom: 4,
  },
});
