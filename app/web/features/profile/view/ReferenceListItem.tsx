import { ListItem, styled } from "@mui/material";
import Pill from "components/Pill";
import TextBody from "components/TextBody";
import UserSummary from "components/UserSummary";
import { referenceBadgeLabel } from "features/profile/constants";
import { localizeYearMonth } from "i18n/datetimes";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { LiteUser } from "proto/api_pb";
import { Reference } from "proto/references_pb";
import { timestampToPlainDateTime } from "utils/date";

export const REFERENCE_LIST_ITEM_TEST_ID = "reference-list-item";

interface ReferenceListItemProps {
  isReceived: boolean;
  user: LiteUser.AsObject;
  reference: Reference.AsObject;
}

const StyledBadgesContainer = styled("div")(({ theme }) => ({
  "& > * + *": {
    marginBlockStart: theme.spacing(2),
  },
  display: "flex",
  flexDirection: "column",
  marginInlineEnd: theme.spacing(2),
  flexShrink: 0,
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  "& > * + *": {
    marginBlockStart: theme.spacing(2),
  },
  alignItems: "flex-start",
  borderBlockEnd: `${theme.typography.pxToRem(1)} solid ${"var(--mui-palette-grey-300)"}`,
  flexDirection: "column",
}));

const StyledReferencesBodyContainer = styled("div")(({ theme }) => ({
  display: "flex",
  width: "100%",
}));

export default function ReferenceListItem({ isReceived, user, reference }: ReferenceListItemProps) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, COMMUNITIES]);

  return (
    <StyledListItem data-testid={REFERENCE_LIST_ITEM_TEST_ID}>
      <UserSummary user={user} />
      <StyledReferencesBodyContainer>
        <StyledBadgesContainer>
          {isReceived && <Pill variant="rounded">{referenceBadgeLabel(t)[reference.referenceType]}</Pill>}
          {reference.writtenTime && (
            <Pill variant="rounded">
              {localizeYearMonth(timestampToPlainDateTime(reference.writtenTime).toPlainDate(), {
                locale,
                abbreviate: true,
                capitalize: true,
              })}
            </Pill>
          )}
        </StyledBadgesContainer>
        <TextBody sx={{ whiteSpace: "pre-wrap" }}>{reference.text}</TextBody>
      </StyledReferencesBodyContainer>
    </StyledListItem>
  );
}
