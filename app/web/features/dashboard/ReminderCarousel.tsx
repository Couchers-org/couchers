import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { Box, styled, useMediaQuery } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import IconButton from "components/IconButton";
import { useAuthContext } from "features/auth/AuthProvider";
import { accountInfoQueryKey, remindersKey, userKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import JSZip from "jszip";
import { useRouter } from "next/router";
import Sentry from "platform/sentry";
import {
  GetRemindersRes,
  ImportFromCouchsurfingComRes,
} from "proto/account_pb";
import { useEffect, useRef, useState } from "react";
import { routeToEditProfile } from "routes";
import { service } from "service";

import { theme } from "../../theme";
import ImportFromCouchsurfingModal from "./ImportFromCouchsurfingModal";
import ReminderItem from "./ReminderItem";

const CARD_WIDTH_DESKTOP = 280;
const CARD_WIDTH_MOBILE = 240;
const CARD_GAP = 16;

const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  width: "100%",
}));

const StyledScroller = styled(Box)({
  display: "flex",
  gap: `${CARD_GAP}px`,
  flex: 1,
  minWidth: 0,
  overflowX: "auto",
  scrollSnapType: "x mandatory",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
});

const StyledCardSlot = styled(Box)({
  flex: `0 0 ${CARD_WIDTH_DESKTOP}px`,
  scrollSnapAlign: "start",

  [theme.breakpoints.down("md")]: {
    flex: `0 0 ${CARD_WIDTH_MOBILE}px`,
  },
});

const StyledArrow = styled(IconButton)({
  backgroundColor: "var(--mui-palette-primary-main)",
  color: "var(--mui-palette-primary-contrastText)",
  "&:hover": {
    backgroundColor: "var(--mui-palette-primary-dark)",
  },
  "&.Mui-disabled": {
    backgroundColor: "var(--mui-palette-grey-300)",
    color: "var(--mui-palette-grey-500)",
  },
});

export default function ReminderCarousel() {
  const { t } = useTranslation([DASHBOARD]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authState } = useAuthContext();

  const { data, error } = useQuery<GetRemindersRes.AsObject, RpcError>({
    queryKey: [remindersKey],
    queryFn: () => service.account.getReminders(),
  });

  const scrollerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const reminders = data?.remindersList ?? [];

  const importMutation = useMutation<
    ImportFromCouchsurfingComRes.AsObject,
    RpcError,
    string
  >({
    mutationFn: (jsonData: string) =>
      service.account.importFromCouchsurfingCom(jsonData, false),
    onSuccess: async (res) => {
      setIsImportModalOpen(false);

      if (!res.success) {
        setImportError(res.errorsList.join(", "));
        return;
      }

      const fieldsCount = res.fieldsUpdatedList.length;
      if (fieldsCount === 0) {
        setImportError(t("dashboard:couchsurfingcom_import.nothing_to_import"));
        return;
      }

      setImportError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [accountInfoQueryKey] }),
        queryClient.invalidateQueries({ queryKey: [remindersKey] }),
        queryClient.invalidateQueries({
          queryKey: userKey(authState.userId ?? undefined),
        }),
      ]);
      router.push(`${routeToEditProfile()}?csImportSuccess=1`);
    },
    onError: (err) => {
      setImportError(err.message);
      Sentry.captureException(err, {
        tags: { component: "ReminderCarousel", action: "importFromCS" },
      });
    },
  });

  const handleFileSelected = async (file: File) => {
    setImportError(null);

    try {
      // Direct JSON file upload
      if (file.name.endsWith(".json")) {
        const jsonContent = await file.text();
        importMutation.mutate(jsonContent);
        return;
      }

      // ZIP file upload
      if (file.name.endsWith(".zip")) {
        const zip = await JSZip.loadAsync(file);
        const jsonFile = Object.values(zip.files).find(
          (f) => !f.dir && f.name.endsWith(".json"),
        );

        if (!jsonFile) {
          setImportError(t("dashboard:couchsurfingcom_import.no_json_error"));
          return;
        }

        const jsonContent = await jsonFile.async("string");
        importMutation.mutate(jsonContent);
        return;
      }

      setImportError(t("dashboard:couchsurfingcom_import.invalid_file_error"));
    } catch (err) {
      setImportError(t("dashboard:couchsurfingcom_import.invalid_zip_error"));
      Sentry.captureException(err, {
        tags: { component: "ReminderCarousel", action: "processFile" },
      });
    }
  };

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollState();
  }, [reminders.length]);

  const scrollByCard = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({
      left:
        direction *
        (isMobile
          ? CARD_WIDTH_DESKTOP + CARD_GAP
          : CARD_WIDTH_MOBILE + CARD_GAP),
      behavior: "smooth",
    });
  };

  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!reminders.length) return null;

  return (
    <>
      {importError && <Alert severity="error">{importError}</Alert>}
      <StyledContainer>
        <StyledArrow
          aria-label="scroll left"
          onClick={() => scrollByCard(-1)}
          disabled={!canScrollLeft}
        >
          <ChevronLeftIcon />
        </StyledArrow>

        <StyledScroller ref={scrollerRef} onScroll={updateScrollState}>
          {reminders.map((reminder, i) => (
            <StyledCardSlot key={i}>
              <ReminderItem
                reminder={reminder}
                onImportFromCS={
                  reminder.completeProfileReminder
                    ? () => setIsImportModalOpen(true)
                    : undefined
                }
              />
            </StyledCardSlot>
          ))}
        </StyledScroller>

        <StyledArrow
          aria-label="scroll right"
          onClick={() => scrollByCard(1)}
          disabled={!canScrollRight}
        >
          <ChevronRightIcon />
        </StyledArrow>
      </StyledContainer>

      <ImportFromCouchsurfingModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onFileSelected={handleFileSelected}
        isLoading={importMutation.isPending}
      />
    </>
  );
}
