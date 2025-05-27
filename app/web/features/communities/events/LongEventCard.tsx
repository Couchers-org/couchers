import {
  Card,
  CardContent,
  CardMedia,
  CardMediaProps,
  styled,
  Tooltip,
  Typography,
} from "@mui/material";
import { eventImagePlaceholderUrl } from "appConstants";
import Pill from "components/Pill";
import FlagButton from "features/FlagButton";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import Link from "next/link";
import { Event } from "proto/events_pb";
import { routeToEvent } from "routes";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";

const StyledCard = styled(Card)(({ theme }) => ({
  margin: 0,
  "&:not(:first-of-type)": {
    margin: theme.spacing(2, 0),
  },
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
  "&:hover": {
    backgroundColor: theme.palette.grey[50],
  },
}));

const CardLayout = styled("div")(({ theme }) => ({
  display: "flex",
  width: "100%",
  height: theme.spacing(20),
  [theme.breakpoints.down("sm")]: {
    height: "auto",
    flexDirection: "column",
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  width: "75%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
}));

const Row = styled("div")({
  display: "flex",
  justifyContent: "space-between",
});

const Title = styled(Typography)(({ theme }) => ({
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxHeight: "3em",
  lineHeight: "1.5em",
  paddingRight: theme.spacing(2),
}));

const Tags = styled("div")(({ theme }) => ({
  minWidth: theme.spacing(15),
  [theme.breakpoints.down("sm")]: {
    minWidth: theme.spacing(10),
  },
}));

const EventInfo = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  flexDirection: "column",
  fontSize: ".85rem",
}));

const Attendees = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "flex-end",
  minWidth: theme.spacing(10),
  fontSize: ".85rem",
  color: theme.palette.text.secondary,
}));

const ImageWrapper = styled("div")(({ theme }) => ({
  position: "relative",
  height: theme.spacing(20),
  width: "25%",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    height: theme.spacing(25),
  },
}));

const StyledCardMedia = styled((props: CardMediaProps) => (
  <CardMedia {...props} />
))(({ theme }) => ({
  height: "100%",
  width: "100%",
  objectFit: "cover",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    height: theme.spacing(25),
  },
}));

const FlagWrapper = styled("div")(({ theme }) => ({
  position: "absolute",
  bottom: 8,
  left: 8,
  backgroundColor: theme.palette.common.white,
  borderRadius: "50%",
  padding: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  zIndex: 10,
}));

const CancelledPill = styled(Pill)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
}));

const LongEventCard = ({
  event,
  userId,
}: {
  event: Event.AsObject;
  userId?: number | null | undefined;
}) => {
  const { t } = useTranslation([COMMUNITIES]);

  const startTime = dayjs(timestamp2Date(event.startTime!)).format("llll");
  const isCreatedByMe = event.creatorUserId === userId;
  const isOnline = event.onlineInformation?.link !== undefined;
  const isCancelled = event.isCancelled;

  return (
    <StyledCard data-testid="event-item">
      <Link href={routeToEvent(event.eventId, event.slug)} passHref>
        <CardLayout>
          <ImageWrapper>
            <StyledCardMedia
              image={event.photoUrl || eventImagePlaceholderUrl}
              title={event.title}
            />
            <FlagWrapper>
              <FlagButton
                contentRef={`event/${event.eventId}`}
                authorUser={event.creatorUserId}
              />
            </FlagWrapper>
          </ImageWrapper>

          <StyledCardContent>
            <Row>
              <Tooltip title={event.title}>
                <Title variant="h3">{event.title}</Title>
              </Tooltip>
              <Tags>
                {isCreatedByMe && (
                  <Pill variant="rounded">
                    {t("communities:created_by_me")}
                  </Pill>
                )}
                {isOnline && (
                  <Pill variant="rounded">{t("communities:online")}</Pill>
                )}
                {isCancelled && (
                  <CancelledPill variant="rounded">
                    {t("communities:cancelled")}
                  </CancelledPill>
                )}
              </Tags>
            </Row>

            <Row>
              <EventInfo>
                {event.offlineInformation
                  ? event.offlineInformation.address
                  : t("communities:virtual_event_location_placeholder")}
                <div>{startTime}</div>
              </EventInfo>
              <Attendees>
                {t("communities:attendees_count", {
                  count: event.goingCount + event.maybeCount,
                })}
              </Attendees>
            </Row>
          </StyledCardContent>
        </CardLayout>
      </Link>
    </StyledCard>
  );
};

export default LongEventCard;
