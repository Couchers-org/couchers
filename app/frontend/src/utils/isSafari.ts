export default function isSafari() {
  const isChrome = navigator.userAgent.indexOf("Chrome") > -1;
  const isSafari = navigator.userAgent.indexOf("Safari") > -1;
  // Chrome also reports itself as Safari so absence of Chrome means it's Safari
  return isSafari && !isChrome;
}
