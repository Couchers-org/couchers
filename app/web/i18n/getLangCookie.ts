// note: manually add a non-secure cookie in development to test this functionality
export function getLangCookie() {
  const name = "couchers-preferred-language=";

  // split multiple cookies from cookie string
  // "couchers-preferred-language=es; some-other-cookie=some value" --> ['couchers-preferred-language=es', ' some-other-cookie=some value']")
  const allCookies = document.cookie.split("; ");

  // find the cookie with key "couchers-preferred-language" and extract its value
  for (let i = 0; i < allCookies.length; i++) {
    const cookie = allCookies[i];

    // if cookie key is couchers-preferred-language
    if (cookie.indexOf(name) == 0) {
      // cookie val will start at the length of the cookie's name
      return cookie.substring(name.length);
    }
  }
  // if not cookie is found, return an empty string
  return "";
}
