import {
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import { accountInfoQueryKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { TFunction, Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { GetAccountInfoRes, ProfilePublicVisibility } from "proto/account_pb";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

type ProfileVisibilityProps = {
  accountInfo: GetAccountInfoRes.AsObject;
  className?: string;
};

export default function ProfileVisibility({
  className,
  accountInfo,
}: ProfileVisibilityProps) {
  const { t } = useTranslation([GLOBAL, AUTH]);

  const { handleSubmit, reset, control } =
    useForm<{ choice: ProfilePublicVisibility }>();

  const onSubmit = handleSubmit(({ choice }) => {
    mutate(choice);
  });

  const queryClient = useQueryClient();
  const { error, isLoading, mutate } = useMutation<
    Empty,
    RpcError,
    ProfilePublicVisibility
  >(service.account.setProfilePublicVisibility, {
    onSuccess: () => {
      queryClient.invalidateQueries(accountInfoQueryKey);
    },
  });

  const choices: [number, Parameters<TFunction<"auth", undefined>>[0]][] = [
    [
      ProfilePublicVisibility.PROFILE_PUBLIC_VISIBILITY_NOTHING,
      "auth:profile_visibility.visiblility_options.nothing",
    ],
    [
      ProfilePublicVisibility.PROFILE_PUBLIC_VISIBILITY_MAP_ONLY,
      "auth:profile_visibility.visiblility_options.map_only",
    ],
    [
      ProfilePublicVisibility.PROFILE_PUBLIC_VISIBILITY_LIMITED,
      "auth:profile_visibility.visiblility_options.limited",
    ],
    [
      ProfilePublicVisibility.PROFILE_PUBLIC_VISIBILITY_MOST,
      "auth:profile_visibility.visiblility_options.most",
    ],
    [
      ProfilePublicVisibility.PROFILE_PUBLIC_VISIBILITY_FULL,
      "auth:profile_visibility.visiblility_options.full_profile",
    ],
  ];

  useEffect(() => {
    reset({ choice: accountInfo.profilePublicVisibility });
  }, [accountInfo, reset]);

  return (
    <div className={className}>
      <Typography variant="h2">{t("auth:profile_visibility.title")}</Typography>
      <Typography variant="body1">
        {t("auth:profile_visibility.choose")}
      </Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      <form onSubmit={onSubmit}>
        <Controller
          control={control}
          defaultValue={accountInfo.profilePublicVisibility}
          name="choice"
          render={({ onChange, value }) => (
            <RadioGroup
              name="profileVisibility"
              value={value}
              onChange={(event) => onChange(Number(event.target.value))}
            >
              {choices.map(([setting, translationKey]) => (
                <FormControlLabel
                  key={setting}
                  value={setting}
                  control={<Radio />}
                  label={
                    <Trans
                      t={t}
                      i18nKey={translationKey}
                      components={{ "1": <strong /> }}
                    />
                  }
                />
              ))}
            </RadioGroup>
          )}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          loading={isLoading}
        >
          {t("global:save")}
        </Button>
      </form>
    </div>
  );
}
