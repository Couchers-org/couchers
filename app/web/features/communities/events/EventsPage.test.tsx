import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { routeToNewEvent } from "routes";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import EventsPage from "./EventsPage";

const { t } = i18n;

describe("Events page", () => {
  it(`takes user to the page if the "${t(
    "communities:create_an_event",
  )}" button is clicked`, async () => {
    render(<EventsPage />, { wrapper });

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: t("communities:create_new_event") }),
    );

    await waitFor(() => {
      expect(mockRouter.asPath).toBe(routeToNewEvent());
    });
  });
});
