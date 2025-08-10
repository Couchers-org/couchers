import {
  alpha,
  ButtonBase,
  Checkbox,
  IconButton,
  InputBase,
  Link,
  Paper,
  Popper,
  styled,
  Typography,
} from "@mui/material";
import Autocomplete, {
  AutocompleteCloseReason,
} from "@mui/material/Autocomplete";
import { CloseIcon, ExpandMoreIcon } from "components/Icons";
import { Trans, useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import React, { useRef, useState } from "react";
import { ControllerRenderProps } from "react-hook-form";
import { theme } from "theme";

const StyledButtonBase = styled(ButtonBase)(() => ({
  "&:focus": {
    boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
  },
  "&:hover": {
    boxShadow: `0 0 0 1px ${theme.palette.text.primary}`,
  },
  borderRadius: theme.shape.borderRadius * 3,
  boxShadow: `0 0 0 1px rgba(0, 0, 0, 0.23)`,
  fontFamily: "inherit",
  fontSize: "16px",
  justifyContent: "space-between",
  margin: theme.spacing(1, 0),
  padding: "18.5px 14px",
  width: "inherit",
}));

const StyledTagsContainer = styled("div")(() => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(auto, 250px))",
}));

const StyledTagWrapper = styled("div")(() => ({
  alignItems: "center",
  display: "flex",
  fontSize: theme.typography.fontSize,
  margin: theme.spacing(1, 0),
  padding: "0 14px",
}));

const StyledTagLabel = styled("span")(() => ({
  marginLeft: theme.spacing(1),
}));

const StyledPopper = styled(Popper)(() => ({
  backgroundColor: theme.palette.background.default,
  borderColor: "rgba(0, 0, 0, 0.23)",
  borderRadius: theme.shape.borderRadius * 3,
  borderStyle: "solid",
  borderWidth: 1,
  boxShadow: theme.shadows[3],
  marginTop: theme.spacing(1),
  zIndex: 101,
}));

const StyledHeader = styled("div")(() => ({
  borderBottomColor: theme.palette.divider,
  borderBottomStyle: "solid",
  borderBottomWidth: 1,
  fontSize: theme.typography.body1.fontSize,
  padding: theme.spacing(1, 2),
  "& > p": {
    whiteSpace: "pre-line",
  },
}));

const StyledInputBase = styled(InputBase)(() => ({
  "& input": {
    "&:focus": {
      borderColor: theme.palette.primary.main,
      boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
    },
    backgroundColor: theme.palette.common.white,
    borderColor: theme.palette.divider,
    borderRadius: theme.shape.borderRadius * 3,
    borderStyle: "solid",
    borderWidth: 1,
    padding: theme.spacing(1),
    transition: theme.transitions.create(["border-color", "box-shadow"]),
  },
  borderBottomColor: theme.palette.divider,
  borderBottomStyle: "solid",
  borderBottomWidth: 1,
  padding: theme.spacing(2),
  width: "100%",
}));

const StyledCheckbox = styled(Checkbox)(() => ({
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
    backgroundColor: theme.palette.action.hover,
  },
  alignItems: "flex-start",
  minHeight: "auto",
  padding: theme.spacing(1),
  backgroundCOlor: "yellow",
}));

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

export default function ProfileTagInput({
  onChange,
  value,
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
              size="large"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <StyledTagLabel>{tag}</StyledTagLabel>
          </StyledTagWrapper>
        ))}
      </StyledTagsContainer>
      <StyledPopper
        id={popperId}
        open={open}
        anchorEl={anchorEl.current}
        placement="bottom-start"
      >
        <StyledHeader>
          <Typography>
            <Trans
              components={{
                support_link: (
                  <Link href="mailto:support@couchers.org" underline="hover" />
                ),
              }}
              i18nKey="profile:profile_tag_input.header_text"
            />
          </Typography>
        </StyledHeader>
        <Autocomplete
          {...inputFieldProps}
          open
          onClose={handleClose}
          multiple
          PopperComponent={StyledAutocompletePopper}
          PaperComponent={StyledAutocompletePaper}
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
              Array.from(uniqueValues).filter((value) => !/^\s*$/.test(value)),
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
          renderOption={(props, option, { selected }) => (
            <StyledAutocompleteOption {...props}>
              <StyledCheckbox color="primary" size="small" checked={selected} />
              {option}
            </StyledAutocompleteOption>
          )}
        />
      </StyledPopper>
    </>
  );
}
