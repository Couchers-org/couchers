import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRef, useState } from "react";
import { theme } from "theme";

export default function CompareTable() {
  const { t } = useTranslation([GLOBAL]);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [tableNudge, setTableNudge] = useState(true);

  return (
    <>
      {/* Mobile nudge above the table (fixed height to avoid layout shift) */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          justifyContent: "flex-end",
          alignItems: "center",
          pr: 0.5,
          pb: 0.5,
          minHeight: 24,
          height: 24,
          pointerEvents: "none",
          color: theme.palette.text.secondary,
          "@keyframes nudgeRightTop": {
            "0%": { transform: "translateX(0)" },
            "50%": { transform: "translateX(6px)" },
            "100%": { transform: "translateX(0)" },
          },
        }}
      >
        <ChevronRightRoundedIcon
          sx={{
            fontSize: 18,
            animation: "nudgeRightTop 1.4s ease-in-out infinite",
            visibility: tableNudge ? "visible" : "hidden",
          }}
        />
      </Box>
      <Box
        sx={{
          overflowX: "auto",
          position: "relative",
          border: `1px solid var(--mui-palette-grey-200)`,
          borderRadius: 2,
          p: 1.5,
        }}
        ref={tableRef}
        onScroll={(e) =>
          setTableNudge((e.currentTarget as HTMLDivElement).scrollLeft === 0)
        }
      >
        <Table
          size="small"
          sx={{
            minWidth: 450,
            "& th, & td": { px: { xs: 0.75, md: 1 }, py: 0.75 },
            "& thead th": { fontWeight: 700 },
            "& thead th:first-of-type": {
              pl: { xs: 0.5, md: 1 },
              pr: { xs: 0.25, md: 1 },
            },
            "& tbody td:first-of-type": {
              fontWeight: 500,
              pl: { xs: 0.5, md: 1 },
              pr: { xs: 0.125, md: 1 },
              whiteSpace: { xs: "normal", md: "nowrap" },
              wordBreak: { xs: "break-word", md: "normal" },
            },
            "& td:not(:first-of-type), & th:not(:first-of-type)": {
              textAlign: "center",
              whiteSpace: "nowrap",
              width: { xs: 60, md: 120 },
              px: { xs: 0.5, md: 1 },
            },
            "& tbody tr:nth-of-type(odd)": {
              backgroundColor: "var(--mui-palette-grey-50)",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>{t("what_is_cs.table.header_couchers")}</TableCell>
              <TableCell>{t("what_is_cs.table.header_hostel")}</TableCell>
              <TableCell>{t("what_is_cs.table.header_hotel")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{t("what_is_cs.table.people_first")}</TableCell>
              <TableCell>
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
              </TableCell>
              <TableCell>
                <CloseIcon color="disabled" fontSize="small" />
              </TableCell>
              <TableCell>
                <CloseIcon color="disabled" fontSize="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("what_is_cs.table.stay_with_locals")}</TableCell>
              <TableCell>
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
              </TableCell>
              <TableCell>
                <CloseIcon color="disabled" fontSize="small" />
              </TableCell>
              <TableCell>
                <CloseIcon color="disabled" fontSize="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("what_is_cs.table.social_expectation")}</TableCell>
              <TableCell>
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
              </TableCell>
              <TableCell>
                <CloseIcon color="disabled" fontSize="small" />
              </TableCell>
              <TableCell>
                <CloseIcon color="disabled" fontSize="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t("what_is_cs.table.professionally_managed")}
              </TableCell>
              <TableCell>
                <CloseIcon color="disabled" fontSize="small" />
              </TableCell>
              <TableCell>
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
              </TableCell>
              <TableCell>
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("what_is_cs.table.meetups_communities")}</TableCell>
              <TableCell>
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
              </TableCell>
              <TableCell>
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
              </TableCell>
              <TableCell>
                <CloseIcon color="disabled" fontSize="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("what_is_cs.table.cultural_exchange")}</TableCell>
              <TableCell>
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
              </TableCell>
              <TableCell>
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
              </TableCell>
              <TableCell>
                <CloseIcon color="disabled" fontSize="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("what_is_cs.table.non_transactional")}</TableCell>
              <TableCell>
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
              </TableCell>
              <TableCell>
                <CloseIcon color="disabled" fontSize="small" />
              </TableCell>
              <TableCell>
                <CloseIcon color="disabled" fontSize="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("what_is_cs.table.cost_to_stay")}</TableCell>
              <TableCell>{t("what_is_cs.table.free_to_stay")}</TableCell>
              <TableCell>{t("what_is_cs.table.dollar")}</TableCell>
              <TableCell>{t("what_is_cs.table.dollars_range")}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t("what_is_cs.table.no_investor_pressure")}
              </TableCell>
              <TableCell>
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
              </TableCell>
              <TableCell>
                <CloseIcon color="disabled" fontSize="small" />
              </TableCell>
              <TableCell>
                <CloseIcon color="disabled" fontSize="small" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    </>
  );
}
