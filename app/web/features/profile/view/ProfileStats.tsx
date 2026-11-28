import { styled, Typography } from "@mui/material";
import RelativeTime from "components/RelativeTime";
import { useTranslation } from "i18n";
import { localizeYearMonth } from "i18n/datetimes";
import { PROFILE } from "i18n/namespaces";
import Link from "next/link";
import { User } from "proto/api_pb";
import { ReactNode } from "react";
import { routeToUser } from "routes";
import { timestampToPlainDateTime } from "utils/date";

type ProfileStatsProps = {
  user: User.AsObject;
};

const StyledRow = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  marginTop: theme.spacing(2),
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: 10,
  overflow: "hidden",
  "& > *": {
    padding: theme.spacing(1.25, 0.5),
    display: "flex",
    flexDirection: "column",
    // label and value stay together; centred so boxes look even when a translated label wraps
    justifyContent: "center",
    gap: theme.spacing(0.25),
    textAlign: "center",
    lineHeight: 1.3,
    overflowWrap: "anywhere",
  },
  "& > * + *": {
    borderInlineStart: "1px solid var(--mui-palette-divider)",
  },
}));

const StyledStatLink = styled(Link)({
  color: "var(--mui-palette-primary-main)",
  textDecoration: "none",
  "&:hover": { textDecoration: "underline" },
});

type StatProps = {
  value: ReactNode;
  label: ReactNode;
  href?: string;
};

function Stat({ value, label, href }: StatProps) {
  return (
    <div>
      <Typography variant="caption" component="div" color="text.secondary">
        {label}
      </Typography>
      <Typography component="div" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
        {href ? (
          <StyledStatLink href={href} scroll={false}>
            {value}
          </StyledStatLink>
        ) : (
          value
        )}
      </Typography>
    </div>
  );
}

export default function ProfileStats({ user }: ProfileStatsProps) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(PROFILE);

  return (
    <StyledRow>
      <Stat
        value={user.numReferences || 0}
        href={routeToUser(user.username, "references")}
        label={t("heading.references")}
      />
      <Stat
        value={
          user.lastActive ? (
            <RelativeTime instant={user.lastActive} smallestUnit="hours" formatStyle="narrow" />
          ) : (
            t("last_active_false")
          )
        }
        label={t("heading.last_active")}
      />
      {user.joined && (
        <Stat
          value={localizeYearMonth(timestampToPlainDateTime(user.joined), locale, {
            abbreviate: true,
            capitalize: true,
          })}
          label={t("heading.joined")}
        />
      )}
    </StyledRow>
  );
}
