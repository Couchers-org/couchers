import Sentry from "platform/sentry";
import { service } from "service";

export async function doAntibot(action: string) {
  if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    return;
  }
  try {
    const token = await window.grecaptcha.enterprise.execute(
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
      { action: action },
    );
    await service.auth.antibot(token, action);
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
