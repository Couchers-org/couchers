import {
  AccessibleOutlined,
  ArrowForward,
  BedOutlined,
  BoltOutlined,
  ChildCareOutlined,
  FestivalOutlined,
  GroupOutlined,
  HomeOutlined,
  LocalBarOutlined,
  LocalParkingOutlined,
  PeopleOutlined,
  PetsOutlined,
  SmokingRoomsOutlined,
  SvgIconComponent,
} from "@mui/icons-material";
import { alpha, Box, styled, Typography } from "@mui/material";
import Button from "components/Button";
import Divider from "components/Divider";
import Markdown from "components/Markdown";
import {
  parkingDetailsLabels,
  sleepingArrangementLabelsShort,
  smokingLocationLabels,
} from "features/profile/constants";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { TFunction } from "i18next";
import { HostingStatus, ParkingDetails, SleepingArrangement, SmokingLocation, User } from "proto/api_pb";
import { useId } from "react";
import { firstName } from "utils/names";

import EditSectionLink from "./EditSectionLink";
import { Fact, FactLabel, SummaryCard, SummaryCards } from "./ProfileFacts";

interface HomeProps {
  user: User.AsObject;
}

const StyledSpacedDivider = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const HomePreviewBox = styled("section")(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: 14,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  background: alpha(theme.palette.primary.main, 0.05),
  "& .summary-card": {
    background: "var(--mui-palette-background-paper)",
  },
}));

// flowing columns rather than a grid, so a two-line fact doesn't leave a gap beside it
const FactColumns = styled("div")(({ theme }) => ({
  columnCount: 2,
  columnGap: theme.spacing(1.5),
  marginTop: theme.spacing(1.5),
  [theme.breakpoints.up("md")]: {
    columnCount: 3,
    columnGap: theme.spacing(2),
  },
  "& > *": {
    breakInside: "avoid",
    marginBottom: theme.spacing(1.5),
  },
}));

const FactGroup = styled("section")(({ theme }) => ({
  // tighter on phones so short facts like "Has housemates" fit on one line
  padding: theme.spacing(1.5),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(2),
  },
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: 12,
}));

const HOSTING_STATUSES = [HostingStatus.HOSTING_STATUS_CAN_HOST, HostingStatus.HOSTING_STATUS_MAYBE];

const KNOWN_SLEEPING_ARRANGEMENTS = [
  SleepingArrangement.SLEEPING_ARRANGEMENT_PRIVATE,
  SleepingArrangement.SLEEPING_ARRANGEMENT_COMMON,
  SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_ROOM,
];

const SMOKING_ANSWERS = [
  SmokingLocation.SMOKING_LOCATION_YES,
  SmokingLocation.SMOKING_LOCATION_WINDOW,
  SmokingLocation.SMOKING_LOCATION_OUTSIDE,
  SmokingLocation.SMOKING_LOCATION_NO,
];

const KNOWN_PARKING_DETAILS = [
  ParkingDetails.PARKING_DETAILS_FREE_ONSITE,
  ParkingDetails.PARKING_DETAILS_FREE_OFFSITE,
  ParkingDetails.PARKING_DETAILS_PAID_ONSITE,
  ParkingDetails.PARKING_DETAILS_PAID_OFFSITE,
];

interface HomeFact {
  icon: SvgIconComponent;
  // the question's label; the yes for yes/no questions, and shown when unanswered
  topic: string;
  // for questions with several possible answers: the label sits above the answer
  labelled?: boolean;
  // the answer; undefined when unanswered
  text?: string;
  detail?: string;
  isNo?: boolean;
}

// Every question keeps its place; answers read as a yes, a (greyed) no, or unanswered.
// The yes reuses the question's existing label (e.g. "Has pets"), so only the "no" wording is new.
function yesNoFact(
  icon: SvgIconComponent,
  label: string,
  value: boolean | undefined,
  noText: string,
  yesDetail?: string,
): HomeFact {
  if (value === undefined) return { icon, topic: label };
  return value
    ? { icon, topic: label, text: label, detail: yesDetail }
    : { icon, topic: label, text: noText, isNo: true };
}

function homeFactGroups(t: TFunction, user: User.AsObject) {
  const maxGuests = user.maxGuests?.value;
  const knownSmoking = SMOKING_ANSWERS.includes(user.smokingAllowed);

  return [
    {
      title: t("profile:home_info_headings.home_facilities"),
      editSectionId: "my-home",
      facts: [
        {
          icon: BedOutlined,
          topic: t("profile:home_info_headings.space"),
          labelled: true,
          text: KNOWN_SLEEPING_ARRANGEMENTS.includes(user.sleepingArrangement)
            ? sleepingArrangementLabelsShort(t)[user.sleepingArrangement]
            : undefined,
        },
        {
          icon: GroupOutlined,
          topic: t("profile:home_info_headings.max_guests"),
          labelled: true,
          text: maxGuests ? `${maxGuests}` : undefined,
        },
        yesNoFact(
          LocalParkingOutlined,
          t("profile:home_info_headings.parking"),
          user.parking?.value,
          t("profile:home_facts.parking_no_text"),
          KNOWN_PARKING_DETAILS.includes(user.parkingDetails)
            ? parkingDetailsLabels(t)[user.parkingDetails]
            : undefined,
        ),
        yesNoFact(
          FestivalOutlined,
          t("profile:edit_home_questions.accept_camping"),
          user.campingOk?.value,
          t("profile:home_facts.tent_camping_no_text"),
        ),
        yesNoFact(
          AccessibleOutlined,
          t("profile:home_info_headings.wheelchair"),
          user.wheelchairAccessible?.value,
          t("profile:home_facts.wheelchair_no_text"),
        ),
      ] as HomeFact[],
    },
    {
      title: t("profile:home_info_headings.household_details"),
      editSectionId: "household-details",
      facts: [
        yesNoFact(
          PeopleOutlined,
          t("profile:home_info_headings.has_housemates"),
          user.hasHousemates?.value,
          t("profile:home_facts.housemates_no_text"),
          user.housemateDetails?.value,
        ),
        yesNoFact(
          ChildCareOutlined,
          t("profile:home_info_headings.has_kids"),
          user.hasKids?.value,
          t("profile:home_facts.kids_at_home_no_text"),
          user.kidDetails?.value,
        ),
        yesNoFact(
          PetsOutlined,
          t("profile:home_info_headings.has_pets"),
          user.hasPets?.value,
          t("profile:home_facts.pets_at_home_no_text"),
          user.petDetails?.value,
        ),
        yesNoFact(
          LocalBarOutlined,
          t("profile:home_info_headings.host_drinking"),
          user.drinksAtHome?.value,
          t("profile:home_facts.drinking_at_home_no_text"),
        ),
        yesNoFact(
          SmokingRoomsOutlined,
          t("profile:home_info_headings.host_smoking"),
          user.smokesAtHome?.value,
          t("profile:home_facts.smoking_at_home_no_text"),
        ),
      ],
    },
    {
      title: t("profile:home_info_headings.hosting_preferences"),
      editSectionId: "hosting-preferences",
      facts: [
        yesNoFact(
          BoltOutlined,
          t("profile:home_info_headings.last_minute"),
          user.lastMinute?.value,
          t("profile:home_facts.last_minute_no_text"),
        ),
        yesNoFact(
          ChildCareOutlined,
          t("profile:edit_home_questions.accept_kids"),
          user.acceptsKids?.value,
          t("profile:home_facts.guest_kids_no_text"),
        ),
        yesNoFact(
          PetsOutlined,
          t("profile:edit_home_questions.accept_pets"),
          user.acceptsPets?.value,
          t("profile:home_facts.guest_pets_no_text"),
        ),
        yesNoFact(
          LocalBarOutlined,
          t("profile:edit_home_questions.accept_drinking"),
          user.drinkingAllowed?.value,
          t("profile:home_facts.guest_drinking_no_text"),
        ),
        {
          icon: SmokingRoomsOutlined,
          topic: t("profile:edit_home_questions.accept_smoking"),
          labelled: true,
          text: knownSmoking ? smokingLocationLabels(t)[user.smokingAllowed] : undefined,
          isNo: user.smokingAllowed === SmokingLocation.SMOKING_LOCATION_NO,
        },
      ] as HomeFact[],
    },
  ];
}

// The hosting basics a surfer checks first, in a box on the About tab that leads to the My home tab
export function HomePreview({ user, onShowHome }: HomeProps & { onShowHome?: () => void }) {
  const { t } = useTranslation([GLOBAL, PROFILE]);

  const maxGuests = user.maxGuests?.value;
  const hasSleepingArrangement = KNOWN_SLEEPING_ARRANGEMENTS.includes(user.sleepingArrangement);
  const lastMinute = user.lastMinute?.value;
  const headingId = useId();
  const canHost = HOSTING_STATUSES.includes(user.hostingStatus);
  if (!canHost || (!maxGuests && !hasSleepingArrangement && !lastMinute)) return null;

  return (
    <HomePreviewBox aria-labelledby={headingId}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Typography
          id={headingId}
          variant="h2"
          sx={{ display: "flex", alignItems: "center", gap: 1, m: 0, fontSize: { xs: "1rem", md: "1.125rem" } }}
        >
          <HomeOutlined aria-hidden sx={{ fontSize: 22, color: "var(--mui-palette-primary-main)" }} />
          {t("profile:home_preview.heading", { first_name: firstName(user.name) })}
          <EditSectionLink
            userId={user.userId}
            tab="home"
            sectionId="hosting-preferences"
            sectionName={t("profile:home_preview.heading", { first_name: firstName(user.name) })}
          />
        </Typography>
        {onShowHome && (
          <Button
            variant="text"
            size="small"
            onClick={onShowHome}
            endIcon={<ArrowForward fontSize="small" />}
            sx={{ whiteSpace: "nowrap", flexShrink: 0, px: 0.5, minWidth: 0 }}
          >
            {t("profile:home_preview.see_more_button")}
          </Button>
        )}
      </Box>
      <SummaryCards>
        {!!maxGuests && (
          <SummaryCard icon={GroupOutlined} value={maxGuests} caption={t("profile:home_info_headings.max_guests")} />
        )}
        {hasSleepingArrangement && (
          <SummaryCard
            icon={BedOutlined}
            value={sleepingArrangementLabelsShort(t)[user.sleepingArrangement]}
            caption={t("profile:home_info_headings.space")}
          />
        )}
        {lastMinute && (
          <SummaryCard
            icon={BoltOutlined}
            value={t("global:yes")}
            caption={t("profile:home_info_headings.last_minute")}
          />
        )}
      </SummaryCards>
    </HomePreviewBox>
  );
}

export default function Home({ user }: HomeProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {homeFactGroups(t, user).map((group) => (
          <FactGroup key={group.title}>
            <FactLabel as="h2" sx={{ m: 0, display: "flex", alignItems: "center", gap: 0.5, minHeight: 30 }}>
              {group.title}
              <EditSectionLink
                userId={user.userId}
                tab="home"
                sectionId={group.editSectionId}
                sectionName={group.title}
              />
            </FactLabel>
            <FactColumns>
              {group.facts.map((fact) =>
                fact.labelled && fact.text ? (
                  <Fact key={fact.topic} icon={fact.icon} label={fact.topic} muted={fact.isNo}>
                    {fact.text}
                  </Fact>
                ) : (
                  // unanswered questions all look the same: the question, greyed, with "Ask me" below
                  <Fact
                    key={fact.topic}
                    icon={fact.icon}
                    muted={!fact.text || fact.isNo}
                    detail={fact.text ? fact.detail : t("profile:info_unanswered")}
                  >
                    {fact.text ?? fact.topic}
                  </Fact>
                ),
              )}
            </FactColumns>
          </FactGroup>
        ))}
      </Box>

      <StyledSpacedDivider />
      {user.aboutPlace && (
        <>
          <Typography variant="h1" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {t("profile:home_info_headings.about_home")}
            <EditSectionLink
              userId={user.userId}
              tab="home"
              sectionId="aboutPlace"
              sectionName={t("profile:home_info_headings.about_home")}
            />
          </Typography>
          <Markdown source={user.aboutPlace} />
          <StyledSpacedDivider />
        </>
      )}
      {user.area && (
        <>
          <Typography variant="h1" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {t("profile:home_info_headings.local_area")}
            <EditSectionLink
              userId={user.userId}
              tab="home"
              sectionId="area"
              sectionName={t("profile:home_info_headings.local_area")}
            />
          </Typography>
          <Markdown source={user.area?.value} />
          <StyledSpacedDivider />
        </>
      )}
      {user.sleepingDetails && (
        <>
          <Typography variant="h1" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {t("profile:home_info_headings.sleeping_arrangement")}
            <EditSectionLink
              userId={user.userId}
              tab="home"
              sectionId="sleepingDetails"
              sectionName={t("profile:home_info_headings.sleeping_arrangement")}
            />
          </Typography>
          <Markdown source={user.sleepingDetails?.value} />
          <StyledSpacedDivider />
        </>
      )}
      {user.houseRules && (
        <>
          <Typography variant="h1" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {t("profile:home_info_headings.house_rules")}
            <EditSectionLink
              userId={user.userId}
              tab="home"
              sectionId="houseRules"
              sectionName={t("profile:home_info_headings.house_rules")}
            />
          </Typography>
          <Markdown source={user.houseRules?.value} />
          <StyledSpacedDivider />
        </>
      )}
      {user.otherHostInfo && (
        <>
          <Typography variant="h1" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {t("profile:heading.additional_information_section")}
            <EditSectionLink
              userId={user.userId}
              tab="home"
              sectionId="otherHostInfo"
              sectionName={t("profile:heading.additional_information_section")}
            />
          </Typography>
          <Markdown source={user.otherHostInfo?.value} />
        </>
      )}
    </>
  );
}
