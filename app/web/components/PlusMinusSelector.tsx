import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Box, IconButton, Typography } from "@mui/material";
import { theme } from "theme";

interface PlusMinusSelectorProps {
  onChange: (value: number) => void;
  value: number | undefined;
}

const PlusMinusSelector = ({ onChange, value }: PlusMinusSelectorProps) => {
  const handleDecrease = () => onChange(Math.max(0, (value ?? 0) - 1));
  const handleIncrease = () => onChange((value ?? 0) + 1);

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-evenly"
      gap={2}
    >
      <IconButton
        onClick={handleDecrease}
        sx={{
          borderRadius: "50%",
          border: `1px solid ${theme.palette.grey[300]}`,
          width: 30,
          height: 30,
        }}
        disabled={!value}
      >
        <RemoveIcon />
      </IconButton>

      <Typography sx={{ width: "30px", textAlign: "center" }}>
        {!value ? "Any" : value}
      </Typography>

      <IconButton
        onClick={handleIncrease}
        sx={{
          borderRadius: "50%",
          border: `1px solid ${theme.palette.grey[300]}`,
          width: 30,
          height: 30,
        }}
      >
        <AddIcon />
      </IconButton>
    </Box>
  );
};

export default PlusMinusSelector;
