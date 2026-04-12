export function getClarificationAnswer(
  question: string,
  clarifications: Array<{ key: string; keywords: string[]; value: string }>,
) {
  const normalized = question.toLowerCase();

  for (const clarification of clarifications) {
    if (clarification.keywords.some((keyword) => normalized.includes(keyword))) {
      return clarification.value;
    }
  }

  return null;
}
