import { ScrapflyClient, ScrapeConfig } from 'scrapfly-sdk';

// Get the API key from environment variables.
const scrapflyApiKey = process.env.SCRAPFLY_API_KEY;

// Ensure the API key is present, throwing an error if it's not.
// This is a critical check to prevent the application from running with an invalid configuration.
if (!scrapflyApiKey) {
  throw new Error('SCRAPFLY_API_KEY is not set in environment variables.');
}

// Initialize the Scrapfly client with the API key.
const scrapfly = new ScrapflyClient({ key: scrapflyApiKey });

/**
 * Scrapes a given URL using Scrapfly's API.
 * This function is configured for robust scraping by enabling Anti-Scraping Protection (ASP)
 * and JavaScript rendering.
 * @param url The URL of the page to scrape.
 * @returns The HTML content of the scraped page.
 * @throws An error if the scraping process fails.
 */
export async function scrapeUrl(url: string) {
  try {
    // Perform the scrape and await the result.
    const result = await scrapfly.scrape(new ScrapeConfig({
      url,
      asp: true, // Enable Anti-Scraping Protection for better success rates.
      render_js: true, // Enable JavaScript rendering to handle modern, dynamic websites.
      country: 'us', // Use a proxy from the United States to improve reliability.
    }));
    // On success, return the full result object, not just the content.
    return result;
  } catch (error) {
    console.error(`Scrapfly error while scraping ${url}:`, error);
    // Re-throw the error to be handled by the calling function.
    throw new Error(`Failed to scrape URL: ${url}. Reason: ${(error as Error).message}`);
  }
}

/*
// --- Example Usage ---
// This block demonstrates how to use the scrapeUrl function.
// It's an Immediately Invoked Function Expression (IIFE) that runs asynchronously.
(async () => {
  try {
    const content = await scrapeUrl('https://quotes.toscrape.com/');
    console.log('Successfully scraped! Content (first 500 chars):');
    console.log(content.substring(0, 500));
  } catch (error) {
    console.error('Example usage failed:', error);
  }
})();
*/ 