import { ButtonProps, styled } from "@mui/material";
import Button from "components/Button";

const StyledButton = styled(Button)<ButtonProps>(({ theme }) => ({
  display: "block",
  flexShrink: 0,
  marginInlineStart: theme.spacing(1),
  height: theme.spacing(5),
  marginBottom: 0,
  marginTop: "auto",
  alignItems: "center",
}));

const FieldButton = ({
  children,
  callback,
  disabled,
  isLoading,
  isSubmit,
  variant = "contained",
}: {
  children: string;
  callback: () => void;
  disabled?: boolean;
  isLoading: boolean;
  isSubmit?: boolean;
  variant?: "text" | "outlined" | "contained";
}) => {
  return (
    <StyledButton
      color="primary"
      disabled={disabled}
      loading={isLoading}
      onClick={callback}
      type={isSubmit ? "submit" : "button"}
      variant={variant}
    >
      {children}
    </StyledButton>
  );
};

export default FieldButton;
