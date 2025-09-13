import { styled, Typography } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Button from "components/Button";
import { AddIcon } from "components/Icons";
import { MenuItem } from "components/Menu";
import { referencesFilterLabels } from "features/profile/constants";
import { useListAvailableReferences } from "features/profile/hooks/referencesHooks";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import Link from "next/link";
import { ReferenceType } from "proto/references_pb";
import React, { useState } from "react";
import {
  hostingRequestsRoute,
  leaveReferenceBaseRoute,
  referenceTypeRoute,
  surfingRequestsRoute,
} from "routes";
import { theme } from "theme";

import { User } from "../../../proto/api_pb";
import ReferencesGivenList from "./ReferencesGivenList";
import ReferencesReceivedList from "./ReferencesReceivedList";

export type ReferenceTypeState = keyof ReturnType<
  typeof referencesFilterLabels
>;

const StyledReferencesContainer = styled("div")({
  display: "flex",
  flexFlow: "row wrap",
});

const StyledHeaderParentContainer = styled("div")(({ theme }) => ({
  width: "100%",
}));

const StyledHeaderContainer = styled("div")(({ theme }) => ({
  alignItems: "center",
  display: "flex",
  justifyContent: "space-between",
  paddingBlockStart: theme.spacing(2),
  width: "100%",
}));

const StyledButtonContainer = styled("div")(({ theme }) => ({
  "& > button": {
    marginInline: theme.spacing(2),
  },
  display: "flex",
  width: "100%",
  justifyContent: "space-between",
  marginInlineEnd: theme.spacing(2),
  marginTop: theme.spacing(1),
}));

export default function References() {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const [referenceType, setReferenceType] = useState<ReferenceTypeState>("all");
  const { userId, friends } = useProfileUser();
  const { data: availableReferences } = useListAvailableReferences(userId);

  const hasPendingHostRefs =
    (availableReferences?.availableWriteReferencesList?.length ?? 0) > 0;

  // Determine if there are pending host-request references to write, and their type
  // Makes an assumption that there will never be more than one pending host-request reference for this user at a time
  const pendingHostRequestRefForThisUser =
    availableReferences?.availableWriteReferencesList?.[0];
  const pendingHostRequestReferenceButtonLabel =
    pendingHostRequestRefForThisUser?.referenceType ===
    ReferenceType.REFERENCE_TYPE_SURFED
      ? t("profile:write_host_request_reference", { type: "Surfer" })
      : t("profile:write_host_request_reference", {
          type: "Host",
        });

  const handleChange = (event: SelectChangeEvent<ReferenceTypeState>) => {
    setReferenceType(event.target.value as ReferenceTypeState);
  };

  return (
    <StyledReferencesContainer>
      <StyledHeaderParentContainer>
        <StyledHeaderContainer>
          <Typography variant="h1" sx={{ marginTop: 0 }}>
            {t("profile:heading.references")}
          </Typography>
          <Select
            variant="standard"
            displayEmpty
            inputProps={{
              "aria-label": t("profile:references_filter_a11y_label"),
            }}
            onChange={handleChange}
            value={referenceType}
            sx={{ paddingInlineStart: theme.spacing(1) }}
          >
            {Object.entries(referencesFilterLabels(t)).map(([key, label]) => {
              const value =
                key === "all" || key === "given" ? key : Number(key);
              return (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              );
            })}
          </Select>
        </StyledHeaderContainer>

        <StyledButtonContainer>
          {hasPendingHostRefs &&
            availableReferences?.availableWriteReferencesList &&
            availableReferences.availableWriteReferencesList.length > 0 && (
              <Button
                component={Link}
                startIcon={<AddIcon />}
                href={
                  pendingHostRequestRefForThisUser?.referenceType ===
                  ReferenceType.REFERENCE_TYPE_SURFED
                    ? surfingRequestsRoute
                    : hostingRequestsRoute
                }
                variant="outlined"
              >
                {pendingHostRequestReferenceButtonLabel}
              </Button>
            )}
          {availableReferences?.canWriteFriendReference &&
            friends === User.FriendshipStatus.FRIENDS && (
              <Button
                component={Link}
                startIcon={<AddIcon />}
                href={`${leaveReferenceBaseRoute}/${referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]}/${userId}`}
              >
                {t("profile:write_friend_reference")}
              </Button>
            )}
        </StyledButtonContainer>
      </StyledHeaderParentContainer>
      {referenceType !== "given" ? (
        <ReferencesReceivedList referenceType={referenceType} />
      ) : (
        <ReferencesGivenList />
      )}
    </StyledReferencesContainer>
  );
}
