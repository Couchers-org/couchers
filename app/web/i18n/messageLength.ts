function humanPerceivedLength(s: string): number {
  // Javascript's string.length counts UTF-16 code units, so "𠮷".length == 2
  // Grapheme clusters correspond more closely to what a human perceives as a character.
  // See backend's corresponding function and keep in sync.
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  let length = 0;
  for (const segment of segmenter.segment(s)) {
    if (segment.segment.trim().length != 0) {
      length++;
    }
  }
  return length;
}
