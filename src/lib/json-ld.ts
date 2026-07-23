// U+2028 (LINE SEPARATOR) and U+2029 (PARAGRAPH SEPARATOR) are valid inside a
// JSON string but illegal in a raw JS string literal / can trip up some HTML
// parsers embedded in a <script> block. Built via fromCharCode so the actual
// codepoints round-trip cleanly through any editor/encoding.
const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);

/** Safely serializes a JSON-LD object for a <script type="application/ld+json">
 *  block. JSON.stringify escapes quotes/backslashes but NOT `<`, `>`, or the
 *  U+2028/U+2029 line separators -- any of those breaking out of the <script>
 *  tag (or corrupting JS string literals elsewhere) is a stored-XSS vector
 *  when the object embeds tenant-authored text (product/farmer descriptions,
 *  names, addresses). Escape all four before injecting via dangerouslySetInnerHTML. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .split("<").join("\\u003c")
    .split(">").join("\\u003e")
    .split(LINE_SEP).join("\\u2028")
    .split(PARA_SEP).join("\\u2029");
}
