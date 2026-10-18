function oneOf(...options: string[]) {
  return `(?:${options.join("|")})`;
}

// \b only works next to ASCII letters in JavaScript, so these two are for English words only.
function word(w: string) {
  return `\\b${w}\\b`;
}

function wordEnding(w: string) {
  return `${w}\\b`;
}

function notFollowedBy(...options: string[]) {
  return `(?!${oneOf(...options)})`;
}

const ENGLISH = [
  wordEnding("nights?"), // "for two nights", not "nightlife"
  word(`host(?:ing)? ${oneOf("me", "us")}`), // "could you host me"
  word("to host") + notFollowedBy(" you"), // "willing to host", but not a host offering "happy to host you"
  word("stay") + notFollowedBy(" there", " until", " till", " here"), // "could I stay with you", not "I will stay there until Friday"
  wordEnding(`to ${oneOf("stay", "sleep", "crash")}`), // "a place to stay"
  word(`your ${oneOf("place", "home")}`), // "is your place free that weekend"
  word("space"), // "do you have space for two"
  word(oneOf("couch", "sofa")) + notFollowedBy("-surf", " surf", " exchange", " request"),
];

// Word stems, so that each also matches the word's other forms ("aloj" catches "alojamiento" and "alojarme").
const OTHER_LANGUAGES = {
  spanish: ["aloj", "dormir", "noches"],
  spanishAndPortuguese: ["hosped"],
  portuguese: ["noites"],
  german: ["übernacht", "unterkunft", "nächte"],
  french: ["h[ée]berg", "nuits"],
  italian: ["notti"],
  russian: ["остановит", "ночл"],
  polish: ["nocleg"],
  // JavaScript's case-insensitive matching does not treat the Turkish dotless ı as an i.
  turkish: ["m[iı]safir", "kalacak"],
};

const HOST_REQUEST_PATTERN = new RegExp(oneOf(...ENGLISH, ...Object.values(OTHER_LANGUAGES).flat()), "i");

/**
 * A rough guess at whether a message is asking to be hosted, for nudging the sender towards a host request
 * instead. It is wrong about one time in ten, so use it for a suggestion, never to block a message.
 */
export function looksLikeHostRequest(text: string) {
  return HOST_REQUEST_PATTERN.test(text);
}
