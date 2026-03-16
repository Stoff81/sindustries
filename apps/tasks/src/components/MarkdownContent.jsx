import { renderMarkdown } from '../utils/markdown.js';

/**
 * Renders markdown content as sanitized HTML.
 * @param {Object} props
 * @param {string} props.markdown - Raw markdown string
 * @param {string} [props.className] - Additional CSS class
 */
export function MarkdownContent({ markdown, className = '' }) {
  const html = renderMarkdown(markdown);
  if (!html) return null;
  return (
    <div
      className={`markdown-body ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
