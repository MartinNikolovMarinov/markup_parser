export function isWhiteSpace (symbol: string): boolean {
  if (typeof symbol === 'undefined' || symbol == null)
    return true
  else
    return symbol.replace(/\s/g, '').length < 1
}

export function notWhiteSpace(symbol: string): boolean {
  return !isWhiteSpace(symbol);
}

export function isLetter(symbol: string): boolean {
  return symbol.toLowerCase() !== symbol.toUpperCase();
}

export const errorMessages = {
  TAGNAME_IS_EMPTY: () => 'Tag name is empty',
  ERROR_ON_LINE: (i: number, j: number, msg: string) => `ERROR ON LINE[${i},${j}]: ${msg}`,
  UNEXPECTED_SEQUENCE: (seq: string) => `Unexpected ${seq} sequence !`,
}