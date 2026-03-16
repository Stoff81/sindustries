import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for safe, sensible defaults
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Render markdown string to sanitized HTML.
 * @param {string} markdown - Raw markdown text
 * @returns {string} Sanitized HTML string
 */
export function renderMarkdown(markdown) {
  if (!markdown || typeof markdown !== 'string') return '';
  const rawHtml = marked.parse(markdown);
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'blockquote',
      'pre', 'code',
      'strong', 'em', 'del', 's',
      'a',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'input',  // for checkboxes
      'img',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'type', 'checked', 'disabled', 'src', 'alt'],
  });
}
