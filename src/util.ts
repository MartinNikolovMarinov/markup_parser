export function isWhiteSpace(symbol: string): boolean {
  if (typeof symbol === 'undefined' || symbol == null) {
    return true;
  } else {
    return symbol.replace(/\s/g, '').length < 1;
  }
}

export function notWhiteSpace(symbol: string): boolean {
  return !isWhiteSpace(symbol);
}

export function isLetter(symbol: string): boolean {
  return symbol.toLowerCase() !== symbol.toUpperCase();
}

export function isElementNode(obj: any) { return 'children' in obj; }

export const errorMessages = {
  TAGNAME_IS_EMPTY: () => 'Tag name is empty !',
  ERROR_ON_LINE: (i: number, j: number, msg: string) => `ERROR ON LINE[${i},${j}]: ${msg}`,
  UNEXPECTED_SEQUENCE: (seq: string) => `Unexpected ${seq} sequence !`,
  INVALID_ATTRIBUTE: () => 'One of the attributes is formatted incorrectly !',
  INVALID_ATTRIBUTE_KEY: () => 'Invalid attribute key !',
  UNEXPECTED_ERROR: () => 'An unexpected error occurred !',
  ESCAPED_SELF_CLOSING_TAG: () => 'Self closing tags can\'t be escaped !',
  TAG_MISMATCH: (opening: string, closing: string) =>
    `Opening(${opening}) and Closing(${closing}) tags are a mismatch !`,
  TAG_FORMATTING_ERR: () => 'An unclosed, or inconsistently formatted, tag detected !',
  INVALID_VARIABLE_KEY_DECLARATION: () => 'Invalid variable KEY declaration !',
  INVALID_VARIABLE_VALUE_DECLARATION: () => 'Invalid variable VALUE declaration !'
};
