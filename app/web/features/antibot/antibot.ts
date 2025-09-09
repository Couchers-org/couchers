import { Sentry } from "@/platform/sentry";
import { service } from "@/service";

export const doAntibot = async (action: string) => {
  if (!Config.recaptchaSiteKey) {
    return;
  }
  try {
    const token = await window.grecaptcha.enterprise.execute(
      Config.recaptchaSiteKey,
      { action },
    );
    await service.auth.antibot(token, action);
  } catch (e) {
    Sentry.captureException(e, {
      tags: {
        component: "antibot",
        action,
        userAgent: navigator.userAgent,
      },
    });
  }
};
