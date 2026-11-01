import { useRouter } from "next/router";
import { useEffect } from "react";

// room for the fixed top nav, so the section isn't hidden under it
const SCROLL_OFFSET = 96;

/**
 * Scrolls to the element whose id is in the URL hash (e.g. /profile/edit/home#household-details)
 * once the form has rendered, and again if the hash changes while on the page.
 */
export default function useScrollToHash(ready: boolean) {
  const { asPath } = useRouter();

  useEffect(() => {
    if (!ready) return;
    const hashIndex = asPath.indexOf("#");
    if (hashIndex === -1) return;
    const id = decodeURIComponent(asPath.slice(hashIndex + 1));
    // a short delay so the form has laid out, including in mobile WebViews
    const timer = window.setTimeout(() => {
      const element = document.getElementById(id);
      if (!element) return;
      const top = element.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [ready, asPath]);
}
