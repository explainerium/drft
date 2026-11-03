/**
 * Invisible markers for editing texts on the page. In edit mode each site text
 * starts with a marker: an invisible separator, then the text's position in
 * the key list written with four more invisible characters. The page looks the
 * same; the editor finds the markers in the DOM and knows which text an element
 * shows. All five are Unicode format characters, which browsers never draw.
 */

const START = "⁣";
const DIGITS = ["⁠", "⁡", "⁢", "⁤"];
// Six base-4 digits: room for 4096 texts.
const WIDTH = 6;

const PATTERN = /⁣([⁠⁡⁢⁤]{6})/g;

export function marker(index: number): string {
  let out = START;
  for (let shift = 2 * (WIDTH - 1); shift >= 0; shift -= 2) out += DIGITS[(index >> shift) & 3];
  return out;
}

/** The positions of every marker in `value`, in order. */
export function readMarkers(value: string): number[] {
  if (!value.includes(START)) return [];
  return [...value.matchAll(PATTERN)].map(([, digits]) =>
    [...digits].reduce((index, digit) => index * 4 + DIGITS.indexOf(digit), 0),
  );
}

export const hasMarker = (value: string | null | undefined): value is string => !!value && value.includes(START);

export const stripMarkers = (value: string): string => value.replace(PATTERN, "");
