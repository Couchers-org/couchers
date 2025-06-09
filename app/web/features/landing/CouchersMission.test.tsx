import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LANDING } from "i18n/namespaces";

import CouchersMission from "./CouchersMission";

jest.mock("i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));
jest.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: jest.fn(), inView: true }),
}));

const missions = [
  `${LANDING}:non_profit_structure`,
  `${LANDING}:community_first_framework`,
  `${LANDING}:member_accountability`,
  `${LANDING}:improved_review_system`,
  `${LANDING}:better_host_matching`,
  `${LANDING}:built_it_right`,
];

describe("CouchersMission", () => {
  test.each(missions)(
    "renders the component correctly with bubble mission clicked: %s",
    async (mission) => {
      render(<CouchersMission />);
      const missionBubble = screen.getByText(`${mission}_title`);
      expect(missionBubble).toBeInTheDocument();

      await userEvent.click(missionBubble);
      const missionDescription = screen.getByText(`${mission}_description`);
      expect(missionDescription).toBeInTheDocument();
    },
  );
});
