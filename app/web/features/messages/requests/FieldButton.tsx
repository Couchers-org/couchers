import { styled } from "@mui/material";
import Button, { AppButtonProps } from "components/Button";
import { theme } from "theme";

const StyledButton = styled(Button)<AppButtonProps>({
  display: "block",
  flexShrink: 0,
  marginInlineStart: theme.spacing(1),
  height: theme.spacing(5),
  marginBottom: 0,
  marginTop: "auto",
  alignItems: "center",
});

const FieldButton = ({
  children,
  callback,
  disabled,
  isLoading,
  isSubmit,
}: {
  children: string;
  callback: () => void;
  disabled?: boolean;
  isLoading: boolean;
  isSubmit?: boolean;
}) => {
  return (
    <StyledButton
      color="primary"
      disabled={disabled}
      loading={isLoading}
      onClick={callback}
      type={isSubmit ? "submit" : "button"}
      variant="contained"
    >
      {children}
    </StyledButton>
  );
};

export default FieldButton;
