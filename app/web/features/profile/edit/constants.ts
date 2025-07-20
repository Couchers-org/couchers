export const DEFAULT_ABOUT_ME_HEADINGS = `# Current mission
<br>
e.g. I want to meet people and learn...
<br>
# Why I use Couchers.org
<br>
e.g. I think couch surfing should be free...
<br>
# My favorite travel story
<br>
e.g. One time I...
`;

export const DEFAULT_HOBBIES_HEADINGS = `# Art
<br>
e.g. Painting, ...
<br>
# Books
<br>
eg. The Cat in the Hat, ...
<br>
# Movies
<br>
e.g. David Attenborough documentaries, ...
<br>
# Music
<br>
e.g. The Wiggles, ...
<br>
`;

export const DEFAULT_ABOUT_HOME_HEADINGS = `# What I can share with guests
<br>
e.g. I can share...
<br>
`;

export const ABOUT_ME_MIN_LENGTH = 150;

export function countAddedCharacters(base: string, input: string): number {
  if (!input) {
    return 0;
  }

  // Normalize both strings for comparison (handle <br> tags and whitespace)
  const normalizeText = (text: string) => {
    return text
      .replace(/<br\s*\/?>/gi, "\n") // convert <br> to newline
      .replace(/\r\n/g, "\n") // normalize line endings
      .replace(/\n\s*\n/g, "\n") // collapse multiple empty lines to single
      .trim();
  };

  const normalizedBase = normalizeText(base);
  const normalizedInput = normalizeText(input);

  // If the text is exactly the same as default, return 0
  if (normalizedInput === normalizedBase) {
    return 0;
  }

  // Find all user content by looking for patterns where content was added
  const userContent: string[] = [];

  // Look for content added to the first example line
  const defaultExample1 = "e.g. I want to meet people and learn...";
  const userExample1Match = normalizedInput.match(
    new RegExp(`${defaultExample1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(.+)`),
  );

  if (userExample1Match) {
    const addedContent = userExample1Match[1].trim();
    userContent.push(addedContent);
  }

  // Look for content added to the second example line
  const defaultExample2 = "e.g. I think couch surfing should be free...";
  const userExample2Match = normalizedInput.match(
    new RegExp(`${defaultExample2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(.+)`),
  );

  if (userExample2Match) {
    const addedContent = userExample2Match[1].trim();
    userContent.push(addedContent);
  }

  // Look for content added to the third example line
  const defaultExample3 = "e.g. One time I...";
  const userExample3Match = normalizedInput.match(
    new RegExp(`${defaultExample3.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(.+)`),
  );

  if (userExample3Match) {
    const addedContent = userExample3Match[1].trim();
    userContent.push(addedContent);
  }

  // Look for content added to headings
  const defaultHeading1 = "# Current mission";
  const userHeading1Match = normalizedInput.match(
    new RegExp(`${defaultHeading1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(.+)`),
  );

  if (userHeading1Match) {
    const addedContent = userHeading1Match[1].trim();
    userContent.push(addedContent);
  }

  const defaultHeading2 = "# Why I use Couchers.org";
  const userHeading2Match = normalizedInput.match(
    new RegExp(`${defaultHeading2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(.+)`),
  );

  if (userHeading2Match) {
    const addedContent = userHeading2Match[1].trim();
    userContent.push(addedContent);
  }

  const defaultHeading3 = "# My favorite travel story";
  const userHeading3Match = normalizedInput.match(
    new RegExp(`${defaultHeading3.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(.+)`),
  );

  if (userHeading3Match) {
    const addedContent = userHeading3Match[1].trim();
    userContent.push(addedContent);
  }

  return userContent.join("\n").trim().length;
}
