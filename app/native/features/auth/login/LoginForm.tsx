import Sentry from "platform/sentry";
import {
  Button,
  TextInput,
  Text,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import isGrpcError from "service/utils/isGrpcError";
import { lowercaseAndTrimField } from "utils/validation";

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

  const onSubmit = handleSubmit(
    async (data: {
      username: string;
      password: string;
      rememberDevice: boolean;
    }) => {
      setLoading(true);
      authActions.clearError();
      try {
        authActions.passwordLogin({
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
          isGrpcError(e) ? e.message : t("global:error.fatal_message"),
        );
      }
      setLoading(false);
    },
  );

  return (
    <>
      <Controller
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder={t("auth:login_page.form.username_field_label")}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            autoComplete="username"
          />
        )}
        name="username"
      />
      {errors.username && <Text>This is required.</Text>}
      <Controller
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder={t("auth:login_page.form.password_field_label")}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            autoComplete="current-password"
            secureTextEntry={true}
          />
        )}
        name="password"
      />
      {errors.password && <Text>This is required.</Text>}
      <Controller
        control={control}
        name="rememberDevice"
        defaultValue={true}
        render={({ field: { onChange, value } }) => (
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>
              {t("auth:login_page.form.remember_me")}
            </Text>
            <Switch onValueChange={onChange} value={value} />
          </View>
        )}
      />
      <Text>To reset your password, go to Couchers.org.</Text>
      <Button
        disabled={loading || authLoading}
        onPress={onSubmit}
        title={t("global:continue")}
      />
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 18,
  },
});
