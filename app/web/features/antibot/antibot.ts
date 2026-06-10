import Sentry from "platform/sentry";
import { service } from "service";

export async function doAntibot(action: string) {
  try {
    await service.auth.antibot("", action);
  } catch (e) {
    Sentry.captureException(e, {
      tags: {
        component: "antibot",
        action: action,
        userAgent: navigator.userAgent,
      },
    });
  }
}
