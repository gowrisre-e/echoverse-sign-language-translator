export async function correctSentence(text) {
  try {
    const response = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `text=${encodeURIComponent(text)}&language=en-US`
    });

    const data = await response.json();

    let correctedText = text;

    if (!data.matches || data.matches.length === 0) {
      return text;
    }

    // Apply corrections from end to start so offsets stay correct
    const matches = [...data.matches].sort((a, b) => b.offset - a.offset);

    matches.forEach(match => {
      if (match.replacements && match.replacements.length > 0) {
        const replacement = match.replacements[0].value;

        correctedText =
          correctedText.slice(0, match.offset) +
          replacement +
          correctedText.slice(match.offset + match.length);
      }
    });

    return correctedText;

  } catch (error) {
    console.error("Correction error:", error);
    return text;
  }
}