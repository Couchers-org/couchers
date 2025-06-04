import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "i18n";
import { useInView } from "react-intersection-observer";

import CouchersMission from "./CouchersMission";

jest.mock("i18n");
jest.mock("react-intersection-observer");

const missions = [
  "non_profit_structure",
  "community_first",
  "member_accountability",
  "improved_review_system",
  "better_host_matching",
  "built_it_right",
];

describe("CouchersMission", () => {
  beforeEach(() => {
    (useInView as jest.Mock).mockReturnValue({ ref: jest.fn(), inView: true });
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => key,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each(missions)(
    "renders the component correctly with bubble mission clicked: %s",
    async (mission) => {
      render(<CouchersMission />);
      const missionBubble = screen.getByText(`${mission}_title`);
      expect(missionBubble).toBeInTheDocument();
      
      await userEvent.click(missionBubble);
      expect(screen.getByText(new RegExp(`${mission}_description`))).toBeInTheDocument();
    }
  );
});
