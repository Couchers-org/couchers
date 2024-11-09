import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { routeToNewEvent } from "routes";
import wrapper from "test/hookWrapper";
import { t } from "test/utils";

import EventsPage from "./EventsPage";

describe("Events page", () => {
  it(`takes user to the page if the "${t(
    "communities:create_an_event"
  )}" button is clicked`, async () => {
    render(<EventsPage />, { wrapper });

    userEvent.click(
      screen.getByRole("button", { name: t("communities:create_new_event") })
    );

    await waitFor(() => {
      expect(mockRouter.asPath).toBe(routeToNewEvent());
    });
  });
});
