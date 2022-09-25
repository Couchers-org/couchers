import {
  alpha,
  ButtonBase,
  Checkbox,
  createStyles,
  IconButton,
  InputBase,
  Link,
  Popper,
  Typography,
} from "@material-ui/core";
import Autocomplete, {
  AutocompleteCloseReason,
} from "@material-ui/lab/Autocomplete";
import { CloseIcon, ExpandMoreIcon } from "components/Icons";
import { Trans, useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import React, { useRef, useState } from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) =>
  createStyles({
    button: {
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
    },
    checkbox: {
      marginRight: theme.spacing(1),
      padding: 0,
    },
    header: {
      borderBottomColor: theme.palette.divider,
      borderBottomStyle: "solid",
      borderBottomWidth: 1,
      fontSize: theme.typography.body1.fontSize,
      padding: theme.spacing(1, 2),
      "& > p": {
        whiteSpace: "pre-line",
      },
    },
    inputBase: {
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
    },
    option: {
      '&[aria-selected="true"]': {
        backgroundColor: "transparent",
      },
      '&[data-focus="true"]': {
        backgroundColor: theme.palette.action.hover,
      },
      alignItems: "flex-start",
      minHeight: "auto",
      padding: theme.spacing(1),
    },
    paper: {
      boxShadow: "none",
      margin: 0,
    },
    popper: {
      backgroundColor: theme.palette.background.default,
      borderColor: "rgba(0, 0, 0, 0.23)",
      borderRadius: theme.shape.borderRadius * 3,
      borderStyle: "solid",
      borderWidth: 1,
      boxShadow: theme.shadows[3],
      marginTop: theme.spacing(1),
      zIndex: 101,
    },
    popperDisablePortal: {
      position: "relative",
    },
    tag: {
      alignItems: "center",
      display: "flex",
      fontSize: theme.typography.fontSize,
      margin: theme.spacing(1, 0),
      padding: "0 14px",
    },
    tagLabel: {
      marginLeft: theme.spacing(1),
    },
    tagsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(auto, 250px))",
    },
  })
);

interface ProfileTagInputProps {
  onChange: (_: unknown, value: string[]) => void;
  value: string[];
  options: string[];
  label: string;
  id: string;
  allowCsv?: boolean;
  className?: string;
}

export default function ProfileTagInput({
  onChange,
  value,
  options,
  label,
  id,
  className,
}: ProfileTagInputProps) {
  const { t } = useTranslation(PROFILE);
  const classes = useStyles();

  const [open, setOpen] = useState<boolean>(false);
  const anchorEl = useRef<null | HTMLButtonElement>(null);
  const [pendingValue, setPendingValue] = useState<string[]>([]);

  const handleClick = () => {
    setPendingValue(value);
    setOpen(true);
  };

  const handleClose = (
    event: React.ChangeEvent<unknown>,
    reason: AutocompleteCloseReason
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
      value.filter((v) => v !== tag)
    );
  };

  const popperId = open ? id : undefined;

  return (
    <>
      <ButtonBase
        aria-describedby={popperId}
        onClick={handleClick}
        ref={anchorEl}
        classes={{
          root: classes.button,
        }}
        className={className}
      >
        <Typography variant="body1">{label}</Typography>
        <ExpandMoreIcon />
      </ButtonBase>
      <div className={classes.tagsContainer}>
        {value.map((tag) => (
          <div key={tag} className={classes.tag}>
            <IconButton
              aria-label={t("profile_tag_input.remove_button_a11y_text", {
                tag,
              })}
              edge="start"
              onClick={() => handleRemove(tag)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <span className={classes.tagLabel}>{tag}</span>
          </div>
        ))}
      </div>
      <Popper
        id={popperId}
        open={open}
        anchorEl={anchorEl.current}
        placement="bottom-start"
        className={classes.popper}
      >
        <div className={classes.header}>
          <Typography>
            <Trans
              components={{
                support_link: <Link href="mailto:support@couchers.org" />,
              }}
              i18nKey="profile:profile_tag_input.header_text"
            />
          </Typography>
        </div>
        <Autocomplete
          open
          onClose={handleClose}
          multiple
          classes={{
            option: classes.option,
            paper: classes.paper,
            popperDisablePortal: classes.popperDisablePortal,
          }}
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
              Array.from(uniqueValues).filter((value) => !/^\s*$/.test(value))
            );
          }}
          value={pendingValue}
          renderInput={(params) => (
            <InputBase
              ref={params.InputProps.ref}
              inputProps={params.inputProps}
              autoFocus
              className={classes.inputBase}
            />
          )}
          disableCloseOnSelect
          disablePortal
          options={options
            .concat(pendingValue.filter((item) => options.indexOf(item) < 0))
            .sort((a, b) => -b[0].localeCompare(a[0]))}
          renderOption={(option, { selected }) => (
            <>
              <Checkbox
                color="primary"
                size="small"
                classes={{ root: classes.checkbox }}
                checked={selected}
              />
              {option}
            </>
          )}
        />
      </Popper>
    </>
  );
}
