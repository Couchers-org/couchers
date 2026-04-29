import {
  alpha,
  ButtonBase,
  Checkbox,
  IconButton,
  InputBase,
  Paper,
  Popper,
  styled,
  Typography,
} from "@mui/material";
import Autocomplete, {
  AutocompleteCloseReason,
} from "@mui/material/Autocomplete";
import { CloseIcon, ExpandMoreIcon } from "components/Icons";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import React, { useRef, useState } from "react";
import { ControllerRenderProps } from "react-hook-form";
import { theme } from "theme";

interface ProfileTagInputProps {
  onChange: (_: unknown, value: string[]) => void;
  value: string[];
  options: string[];
  label: string;
  id: string;
  allowCsv?: boolean;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputFieldProps?: ControllerRenderProps<any, string>;
}

const StyledButtonBase = styled(ButtonBase)(() => ({
  "&:focus": {
    boxShadow: `0 0 0 2px var(--mui-palette-primary-main)`,
  },
  "&:hover": {
    borderColor: "var(--mui-palette-primary-main)",
    backgroundColor: "var(--mui-palette-grey-50)",
  },
  borderRadius: theme.spacing(1.5),
  border: `1px solid var(--mui-palette-grey-300)`,
  backgroundColor: "var(--mui-palette-background-paper)",
  fontFamily: "inherit",
  fontSize: "1rem",
  justifyContent: "space-between",
  margin: theme.spacing(1, 0),
  padding: theme.spacing(1.5, 2),
  width: "inherit",
  transition: "all 0.2s ease-in-out",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
}));

const StyledTagsContainer = styled("div")(() => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(auto, 250px))",
}));

const StyledTagWrapper = styled("div")(() => ({
  alignItems: "center",
  display: "flex",
  fontSize: theme.typography.fontSize,
  margin: theme.spacing(0.5, 0.5, 0.5, 0),
  padding: theme.spacing(0.75, 1.5),
  backgroundColor: "var(--mui-palette-primary-main)",
  border: `1px solid var(--mui-palette-primary-dark)`,
  borderRadius: theme.spacing(2),
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)",
    transform: "translateY(-1px)",
  },
}));

const StyledTagLabel = styled("span")(() => ({
  marginLeft: theme.spacing(0.75),
  fontWeight: 500,
  color: "var(--mui-palette-common-white)",
}));

const StyledPopper = styled(Popper)(() => ({
  backgroundColor: "var(--mui-palette-background-paper)",
  borderColor: "var(--mui-palette-grey-200)",
  borderRadius: theme.spacing(1.5),
  borderStyle: "solid",
  borderWidth: 1,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  marginTop: theme.spacing(1),
  zIndex: 101,
}));

const StyledHeader = styled("div")(() => ({
  borderBottomColor: "var(--mui-palette-divider)",
  borderBottomStyle: "solid",
  borderBottomWidth: 1,
  fontSize: theme.typography.body1.fontSize,
  padding: theme.spacing(1, 2),
  "& > p": {
    whiteSpace: "pre-line",
  },
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  "& input": {
    "&:focus": {
      borderColor: "var(--mui-palette-primary-main)",
      boxShadow: `${alpha(theme.palette.primary.main, 0.15)} 0 0 0 2px`,
    },
    backgroundColor: "var(--mui-palette-background-paper)",
    borderColor: "var(--mui-palette-divider)",
    borderRadius: theme.spacing(1),
    borderStyle: "solid",
    borderWidth: 1,
    padding: theme.spacing(1, 1.5),
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    fontSize: "0.875rem",
  },
  borderBottomColor: "var(--mui-palette-divider)",
  borderBottomStyle: "solid",
  borderBottomWidth: 1,
  padding: theme.spacing(2),
  width: "100%",
}));

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  marginRight: theme.spacing(1),
  padding: 0,
}));

const StyledAutocompletePopper = styled(Popper)(() => ({
  position: "relative",
}));

const StyledAutocompletePaper = styled(Paper)(() => ({
  boxShadow: "none",
  margin: 0,
}));

const StyledAutocompleteOption = styled("li")(() => ({
  '&[aria-selected="true"]': {
    backgroundColor: "transparent",
  },
  "&.MuiAutocomplete-option.Mui-focused": {
    backgroundColor: "var(--mui-palette-action-hover)",
  },
  alignItems: "flex-start",
  minHeight: "auto",
  padding: theme.spacing(1),
}));

export default function ProfileTagInput({
  onChange,
  value = [],
  options,
  label,
  id,
  className,
  inputFieldProps,
}: ProfileTagInputProps) {
  const { t } = useTranslation(PROFILE);

  const [open, setOpen] = useState<boolean>(false);
  const anchorEl = useRef<null | HTMLButtonElement>(null);
  const [pendingValue, setPendingValue] = useState<string[]>([]);

  const handleClick = () => {
    setPendingValue(value);
    setOpen(true);
  };

  const handleClose = (
    _: React.ChangeEvent<unknown>,
    reason: AutocompleteCloseReason,
  ) => {
    if (reason === "toggleInput") {
      return;
    }
    onChange(null, pendingValue);
    setOpen(false);
  };

  const handleRemove = (tag: string) => {
    onChange(
      null,
      value.filter((v) => v !== tag),
    );
  };

  const popperId = open ? id : undefined;

  return (
    <>
      <StyledButtonBase
        aria-describedby={popperId}
        onClick={handleClick}
        ref={anchorEl}
        className={className}
      >
        <Typography variant="body1">{label}</Typography>
        <ExpandMoreIcon />
      </StyledButtonBase>
      <StyledTagsContainer>
        {value.map((tag) => (
          <StyledTagWrapper key={tag}>
            <IconButton
              aria-label={t("profile_tag_input.remove_button_a11y_text", {
                tag,
              })}
              edge="start"
              onClick={() => handleRemove(tag)}
              size="small"
              sx={{
                color: "var(--mui-palette-common-white)",
                padding: 0.5,
                "&:hover": {
                  backgroundColor: "var(--mui-palette-primary-dark)",
                  color: "var(--mui-palette-common-white)",
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <StyledTagLabel>{tag}</StyledTagLabel>
          </StyledTagWrapper>
        ))}
      </StyledTagsContainer>
      {open && anchorEl.current && (
        <StyledPopper
          id={popperId}
          open={open}
          anchorEl={anchorEl.current}
          placement="bottom-start"
        >
          <Autocomplete
            {...inputFieldProps}
            open
            onClose={handleClose}
            multiple
            onChange={(_, newValue) => {
              let uniqueValues: Set<string>;
              if (Array.isArray(newValue) && newValue.length) {
                // For some reason I came across situations when there were undefined values in this array.
                newValue = newValue.filter((element) => element !== undefined);

                uniqueValues = new Set(newValue);
              } else {
                uniqueValues = new Set([]);
              }
              setPendingValue(
                Array.from(uniqueValues).filter(
                  (value) => !/^\s*$/.test(value),
                ),
              );
            }}
            value={pendingValue}
            renderInput={(params) => (
              <StyledInputBase
                ref={params.InputProps.ref}
                inputProps={params.inputProps}
                autoFocus
              />
            )}
            disableCloseOnSelect
            disablePortal
            options={options
              .concat(pendingValue.filter((item) => options.indexOf(item) < 0))
              .sort((a, b) => -b.localeCompare(a))}
            renderOption={(props, option, { selected }) => {
              const { key, ...rest } = props;

              return (
                <StyledAutocompleteOption key={key} {...rest}>
                  <StyledCheckbox
                    color="primary"
                    size="small"
                    checked={selected}
                  />

                  {option}
                </StyledAutocompleteOption>
              );
            }}
            slots={{
              paper: StyledAutocompletePaper,
              popper: StyledAutocompletePopper,
            }}
          />
        </StyledPopper>
      )}
    </>
  );
}
