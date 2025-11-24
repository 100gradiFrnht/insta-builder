export const parseMarkdown = (text) => {
  const segments = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Try to match ***text*** (bold italic)
    let match = remaining.match(/^\*\*\*(.+?)\*\*\*/);
    if (match) {
      segments.push({ text: match[1], bold: true, italic: true });
      remaining = remaining.substring(match[0].length);
      continue;
    }

    // Try to match **text** (bold)
    match = remaining.match(/^\*\*(.+?)\*\*/);
    if (match) {
      segments.push({ text: match[1], bold: true, italic: false });
      remaining = remaining.substring(match[0].length);
      continue;
    }

    // Try to match *text* (italic)
    match = remaining.match(/^\*(.+?)\*/);
    if (match) {
      segments.push({ text: match[1], bold: false, italic: true });
      remaining = remaining.substring(match[0].length);
      continue;
    }

    // No match - take one character as plain text
    const nextAsterisk = remaining.substring(1).search(/\*/);
    const plainText = nextAsterisk === -1
      ? remaining
      : remaining.substring(0, nextAsterisk + 1);

    segments.push({ text: plainText, bold: false, italic: false });
    remaining = remaining.substring(plainText.length);
  }

  return segments.length > 0 ? segments : [{ text, bold: false, italic: false }];
};
