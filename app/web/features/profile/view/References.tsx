import { Typography, styled } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Link from "next/link";
import React, { useState } from "react";

import Button from "@/components/Button";
import { AddIcon } from "@/components/Icons";
import { MenuItem } from "@/components/Menu";
import { referencesFilterLabels } from "@/features/profile/constants";
import { useListAvailableReferences } from "@/features/profile/hooks/referencesHooks";
import { useProfileUser } from "@/features/profile/hooks/useProfileUser";
import { useTranslation } from "@/i18n";
import { GLOBAL, PROFILE } from "@/i18n/namespaces";
import { User } from "@/proto/api_pb";
import { ReferenceType } from "@/proto/references_pb";
import { LEAVE_REFERENCE_BASE_ROUTE, REFERENCE_TYPE_ROUTE } from "@/routes";
import { theme } from "@/theme";

import ReferencesGivenList from "./ReferencesGivenList";
import ReferencesReceivedList from "./ReferencesReceivedList";

export type ReferenceTypeState = keyof ReturnType<
  typeof referencesFilterLabels
>;

const StyledReferencesContainer = styled("div")({
  display: "flex",
  flexFlow: "row wrap",
});

const StyledHeaderParentContainer = styled("div")(() => ({
  width: "100%",
}));

const StyledHeaderContainer = styled("div")(() => ({
  alignItems: "center",
  display: "flex",
  justifyContent: "space-between",
  paddingBlockStart: theme.spacing(2),
  width: "100%",
}));

const StyledButtonContainer = styled("div")(() => ({
  "& > button": {
    marginInline: theme.spacing(2),
  },
  display: "flex",
  width: "100%",
  justifyContent: "flex-end",
  marginInlineEnd: theme.spacing(2),
  marginTop: theme.spacing(1),
}));

const References = () => {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const [referenceType, setReferenceType] = useState<ReferenceTypeState>("all");
  const { userId, friends } = useProfileUser();
  const { data: availableReferences } = useListAvailableReferences(userId);

  const handleChange = (event: SelectChangeEvent<ReferenceTypeState>) => {
    setReferenceType(event.target.value);
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
        {availableReferences?.canWriteFriendReference &&
          friends === User.FriendshipStatus.FRIENDS && (
            <StyledButtonContainer>
              <Button
                component={Link}
                startIcon={<AddIcon />}
                href={`${LEAVE_REFERENCE_BASE_ROUTE}/${REFERENCE_TYPE_ROUTE[ReferenceType.REFERENCE_TYPE_FRIEND]}/${userId}`}
              >
                {t("profile:write_reference")}
              </Button>
            </StyledButtonContainer>
          )}
      </StyledHeaderParentContainer>
      {referenceType !== "given" ? (
        <ReferencesReceivedList referenceType={referenceType} />
      ) : (
        <ReferencesGivenList />
      )}
    </StyledReferencesContainer>
  );
};

export default References;
