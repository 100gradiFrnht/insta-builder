export const transformTextCase = (text, textCase) => {
  if (!textCase || textCase === 'default') return text;

  switch (textCase) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'titlecase':
      return text.replace(/\w\S*/g, (word) =>
        word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
      );
    case 'sentencecase':
      return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
    default:
      return text;
  }
};
