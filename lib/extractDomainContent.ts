import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Extracts the content from a given domain's homepage
 * @param domain The domain to extract content from (without protocol)
 * @returns A string containing the extracted content
 */
export async function extractDomainContent(domain: string): Promise<string> {
  // Make sure the domain doesn't have protocol
  const cleanDomain = domain.replace(/^https?:\/\//, '');
  
  try {
    // First try HTTPS
    const url = `https://${cleanDomain}`;
    console.log(`Fetching content from ${url}`);
    
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    return extractContentFromHTML(response.data, domain);
  } catch (error) {
    console.error(`Error with HTTPS, trying HTTP: ${error}`);
    
    try {
      // If HTTPS fails, try HTTP
      const url = `http://${cleanDomain}`;
      console.log(`Fetching content from ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      return extractContentFromHTML(response.data, domain);
    } catch (secondError) {
      console.error(`Failed to fetch from HTTP as well: ${secondError}`);
      throw new Error(`Failed to fetch content from ${domain}`);
    }
  }
}

/**
 * Extracts relevant content from HTML
 * @param html HTML content to extract from
 * @param domain The domain being processed
 * @returns Extracted text content
 */
function extractContentFromHTML(html: string, domain: string): string {
  const $ = cheerio.load(html);
  
  // Remove script, style, and svg elements
  $('script, style, svg, noscript, iframe, img').remove();
  
  // Get meta description
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  
  // Get page title
  const pageTitle = $('title').text() || '';
  
  // Extract text from important elements
  const headlines = $('h1, h2, h3').map((_, el) => $(el).text().trim()).get().join('\n');
  const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().join('\n');
  const navItems = $('nav a, header a').map((_, el) => $(el).text().trim()).get().join(', ');
  const listItems = $('li').map((_, el) => $(el).text().trim()).get().join('\n');
  
  // Combine all extracted content
  let combinedContent = [
    `Domain: ${domain}`,
    `Title: ${pageTitle}`,
    `Description: ${metaDescription}`,
    `Navigation: ${navItems}`,
    `Main Headlines:`,
    headlines,
    `Content:`,
    paragraphs,
    `List Items:`,
    listItems
  ].filter(Boolean).join('\n\n');
  
  // Clean up the content
  combinedContent = combinedContent
    .replace(/\s+/g, ' ')               // Replace multiple spaces with single space
    .replace(/(\n\s*\n)+/g, '\n\n')     // Replace multiple newlines with double newline
    .trim();
  
  // Limit the content length to avoid huge responses
  const maxLength = 4000;
  if (combinedContent.length > maxLength) {
    combinedContent = combinedContent.substring(0, maxLength) + `\n\n[Content truncated. Total length: ${combinedContent.length} characters]`;
  }
  
  return combinedContent;
} 