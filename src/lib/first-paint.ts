/**
 * Whether the first page of this visit has been shown. Until then nothing is hidden for an entrance animation, so
 * the page is readable as soon as the HTML arrives, even before the JavaScript has loaded (slow phones and
 * connections). Afterwards, page changes animate as before. On the server this always stays false.
 */
export const firstPaint = { done: false };
