import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import { ACCOUNT_INFO_QUERY_KEY } from "@/features/queryKeys";
import { Trans, useTranslation } from "@/i18n";
import { AUTH, GLOBAL } from "@/i18n/namespaces";
import { GetAccountInfoRes, ProfilePublicVisibility } from "@/proto/account_pb";
import { service } from "@/service";

type ProfileVisibilityProps = {
  accountInfo: GetAccountInfoRes.AsObject;
  className?: string;
};

const ProfileVisibility = ({
  className,
  accountInfo,
}: ProfileVisibilityProps) => {
  const { t } = useTranslation([GLOBAL, AUTH]);

  const { handleSubmit, reset, control } = useForm<{
    choice: ProfilePublicVisibility;
  }>();

  const onSubmit = handleSubmit(({ choice }) => {
    mutate(choice);
  });

  const queryClient = useQueryClient();
  const { error, isPending, mutate } = useMutation<
    Empty,
    RpcError,
    ProfilePublicVisibility
  >({
    mutationFn: (choice) => service.account.setProfilePublicVisibility(choice),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [ACCOUNT_INFO_QUERY_KEY],
      });
    },
  });

  const choices: [number, string][] = [
    [
      ProfilePublicVisibility.PROFILE_PUBLIC_VISIBILITY_NOTHING,
      "auth:profile_visibility.visiblility_options.nothing",
    ],
    [
      ProfilePublicVisibility.PROFILE_PUBLIC_VISIBILITY_MAP_ONLY,
      "auth:profile_visibility.visiblility_options.map_only",
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
      <form onSubmit={() => void onSubmit()}>
        <Controller
          control={control}
          name="choice"
          defaultValue={accountInfo.profilePublicVisibility}
          render={({ field }) => (
            <FormControl component="fieldset" sx={{ mb: 2, display: "block" }}>
              <RadioGroup
                {...field}
                row
                onChange={(_event, newValue) => {
                  field.onChange(Number(newValue));
                }}
                sx={{ marginBlockStart: 1 }}
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
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        components={{ "1": <strong /> }}
                      />
                    }
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          loading={isPending}
        >
          {t("global:save")}
        </Button>
      </form>
    </div>
  );
};

export default ProfileVisibility;
