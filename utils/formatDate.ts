export function formatDate(dateString: string): string {
  if (!dateString) return 'Date not available';
  try {
    const date = new Date(dateString);
    // For a more user-friendly format, e.g., "January 1, 2023"
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}
