import { ExpandMore } from "@mui/icons-material";
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
  // each box, whether a div or the references link
  "& > *": {
    padding: theme.spacing(1.25, 0.5),
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    textAlign: "center",
    lineHeight: 1.3,
    overflowWrap: "anywhere",
  },
  "& > * + *": {
    borderInlineStart: "1px solid var(--mui-palette-divider)",
  },
}));

const StyledStatLink = styled(Link)({
  color: "inherit",
  textDecoration: "none",
});

const StyledLinkLabel = styled("span")({
  display: "inline-flex",
  alignItems: "center",
  color: "var(--mui-palette-primary-main)",
  fontWeight: 500,
});

type StatProps = {
  value: ReactNode;
  label: ReactNode;
  isLargeValue?: boolean;
  href?: string;
};

function Stat({ value, label, isLargeValue = false, href }: StatProps) {
  const content = (
    <>
      <Typography
        variant={isLargeValue ? "h2" : "body2"}
        component="div"
        sx={{ fontWeight: 500, margin: 0, lineHeight: 1.3 }}
      >
        {value}
      </Typography>
      <Typography variant="caption" component="div" color="text.secondary">
        {label}
      </Typography>
    </>
  );

  return href ? (
    <StyledStatLink href={href} scroll={false}>
      {content}
    </StyledStatLink>
  ) : (
    <div>{content}</div>
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
        isLargeValue
        href={routeToUser(user.username, "references")}
        label={
          <StyledLinkLabel>
            {t("heading.references")}
            <ExpandMore sx={{ fontSize: 14 }} aria-hidden />
          </StyledLinkLabel>
        }
      />
      <Stat
        value={
          user.lastActive ? <RelativeTime instant={user.lastActive} smallestUnit="hours" /> : t("last_active_false")
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
