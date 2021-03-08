import {
  ButtonBase,
  Checkbox,
  createStyles,
  fade,
  IconButton,
  InputBase,
  makeStyles,
  Popper,
  Typography,
} from "@material-ui/core";
import Autocomplete, {
  AutocompleteCloseReason,
} from "@material-ui/lab/Autocomplete";
import { CloseIcon, ExpandMoreIcon } from "components/Icons";
import React, { useRef, useState } from "react";

const useStyles = makeStyles((theme) =>
  createStyles({
    button: {
      "&:focus": {
        boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
      },
      "&:hover": {
        boxShadow: `0 0 0 1px ${theme.palette.text.primary}`,
      },
      borderRadius: theme.shape.borderRadius,
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
      fontSize: theme.typography.fontSize,
      padding: theme.spacing(1, 2),
    },
    inputBase: {
      "& input": {
        "&:focus": {
          borderColor: theme.palette.primary.main,
          boxShadow: `${fade(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
        },
        backgroundColor: theme.palette.common.white,
        borderColor: theme.palette.divider,
        borderRadius: theme.shape.borderRadius,
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
      borderRadius: theme.shape.borderRadius,
      borderStyle: "solid",
      borderWidth: 1,
      boxShadow: theme.shadows[3],
      marginTop: theme.spacing(1),
      zIndex: 1,
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
  })
);

interface ProfileTagInputProps {
  onChange: (_: any, value: string[]) => void;
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
  allowCsv = true,
  className,
}: ProfileTagInputProps) {
  const classes = useStyles();

  const [open, setOpen] = useState<boolean>(false);
  const anchorEl = useRef<null | HTMLButtonElement>(null);
  const [pendingValue, setPendingValue] = useState<string[]>([]);

  const handleClick = () => {
    setPendingValue(value);
    setOpen(true);
  };

  const handleClose = (
    event: React.ChangeEvent<{}>,
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
      {value.map((tag) => (
        <div key={tag} className={classes.tag}>
          <IconButton
            aria-label={`Remove ${tag}`}
            edge="start"
            onClick={() => handleRemove(tag)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <span className={classes.tagLabel}>{tag}</span>
        </div>
      ))}
      <Popper
        id={popperId}
        open={open}
        anchorEl={anchorEl.current}
        placement="bottom-start"
        className={classes.popper}
      >
        <div className={classes.header}>Press 'Enter' to add</div>
        <Autocomplete
          open
          onClose={handleClose}
          freeSolo
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

              if (allowCsv) {
                const lastIndex = newValue.length - 1;
                const latestEntry = newValue[lastIndex];
                const previousEntries = newValue.slice(0, lastIndex);
                uniqueValues = new Set([
                  ...previousEntries,
                  ...latestEntry.split(",").map((value) => value.trim()),
                ]);
              } else {
                uniqueValues = new Set(newValue);
              }
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
