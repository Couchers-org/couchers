import { Snackbar } from "@material-ui/core";
import { CloseIcon, NotificationNewIcon } from "components/Icons";
import { useTranslation } from "i18n";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { theme } from "theme";
import makeStyles from "utils/makeStyles";

type AlertSeverity = "info" | "success" | "warning" | "error";

export enum AlertSeverityEnum {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
}

interface NotificationState {
  open: boolean;
  message: string;
  severity?: AlertSeverity;
}

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertSeverityEnum) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Custom hook to use the NotificationContext
export const useSendNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useSendNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

const useStyles = makeStyles((theme) => ({
  icon: {
    marginRight: theme.spacing(2),
  },
  message: {
    display: "flex",
    alignItems: "center",
    fontSize: ".8rem",
    height: "100%",
    width: "100%",

    "@media (max-width: 600px)": {
      fontSize: "1rem",
    },
  },
  root: {
    "&.MuiSnackbar-root": {
      transform: "unset",
      width: "90%",
      maxWidth: "380px",
      height: "auto",
      minHeight: "80px",

      "@media (max-width: 600px)": {
        margin: "0 auto",
        width: "100%",
        height: "auto",
      },
    },
    "& .MuiSnackbarContent-root": {
      flexGrow: "1",
      flexWrap: "nowrap",
      backgroundColor: "white",
      color: theme.palette.text.primary,
      border: `2px solid ${theme.palette.primary.main}`,
      borderRadius: theme.shape.borderRadius,
      width: "100%",
      height: "100%",
    },
  },
}));

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: AlertSeverityEnum.INFO,
  });

  const showNotification = (
    message: string,
    severity: AlertSeverityEnum = AlertSeverityEnum.INFO
  ) => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleClose = () => {
    setNotification((prevState) => ({
      ...prevState,
      open: false,
    }));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Snackbar
        className={classes.root}
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        message={
          <div className={classes.message}>
            <NotificationNewIcon
              className={classes.icon}
              htmlColor={theme.palette.primary.main}
            />
            {notification.message}
          </div>
        }
        action={
          <CloseIcon
            aria-label={t("close")}
            color="action"
            onClick={handleClose}
            fontSize="small"
          />
        }
      ></Snackbar>
    </NotificationContext.Provider>
  );
};
