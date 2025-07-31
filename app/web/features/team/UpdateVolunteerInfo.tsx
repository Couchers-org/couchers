import { styled, Typography } from "@mui/material";
import CustomColorSwitch from "components/CustomColorSwitch";
import useAccountInfo from "features/auth/useAccountInfo";
import { volunteerInfoQueryKey } from "features/queryKeys";
import useVolunteerInfo from "features/team/useVolunteerInfo";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";
import { UpdateVolunteerInfoParams } from "service/account";
import { theme } from "theme";

const StyledTitleBox = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
}));

export default function UpdateVolunteerInfo() {
  const { t } = useTranslation([GLOBAL]);

  const accountInfo = useAccountInfo();
  const volunteerInfo = useVolunteerInfo();

  const queryClient = useQueryClient();

  const { mutate: updateVolunteerInfoMutation, error: mutationError } =
    useMutation<Empty, RpcError, UpdateVolunteerInfoParams>(
      (info) => service.account.updateVolunteerInfo(info),
      {
        onSuccess: () => queryClient.invalidateQueries([volunteerInfoQueryKey]),
      },
    );

  if (!accountInfo.data?.isVolunteer || !volunteerInfo.data) {
    return <></>;
  }

  return (
    <div>
      <StyledTitleBox>
        <Typography variant="h2">
          {t("team.volunteer_settings.show_on_team_page.title")}
        </Typography>

        <CustomColorSwitch
          checked={volunteerInfo.data.showOnTeamPage}
          onClick={() =>
            updateVolunteerInfoMutation({
              showOnTeamPage: !(
                volunteerInfo.data.showOnTeamPage.valueOf() ?? false
              ),
            })
          }
          customColor={theme.palette.primary.main}
          isLoading={accountInfo.isLoading}
        />
        {mutationError && <div>{mutationError.message}</div>}
      </StyledTitleBox>
      {/* @TODO(FB) Error handling */}
      {/* {errorMessage && (
        <StyledAlert severity="error">
          {errorMessage ||
            t("notification_settings.push_notifications.error_generic")}
        </StyledAlert>
      )}*/}

      <Typography variant="body1" sx={{ marginBottom: theme.spacing(2) }}>
        {volunteerInfo.data.showOnTeamPage
          ? t("team.volunteer_settings.show_on_team_page.enabled_message")
          : t("team.volunteer_settings.show_on_team_page.disabled_message")}
      </Typography>
    </div>
  );
}
