export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toString()                     // Ensure input is string
    .toLowerCase()                  // Convert to lowercase
    .trim()                         // Remove leading/trailing whitespace
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')        // Remove all non-word chars except -
    .replace(/--+/g, '-')           // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// You might want to add a unique suffix for potential collisions later
// e.g., using a short random string or timestamp
// export function createUniqueSlug(text: string): string {
//   const baseSlug = slugify(text);
//   const uniqueSuffix = Math.random().toString(36).substring(2, 8); // Example
//   return `${baseSlug}-${uniqueSuffix}`;
// }
