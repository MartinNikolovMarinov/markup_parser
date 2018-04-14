import { ROOT_TAG_NAME } from './constants'
import {
  errorMessages as em,
  isLetter,
  isWhiteSpace,
  notWhiteSpace,
} from './util'

let parseFlags = {
  isEscaped: false,
  isNested: false
}

enum StateEnum {
  OutOFAllTags = 1,
  InOpeningTag = 2, // (found <)
  InTagName = 3, // (found first non white space)
  InAttribute = 4, // (found non white space)
  InOpeningTagWhiteSpace = 5,
  InTagBody = 6, // (found >)
  InClosingTag = 7, // (found </)
  InEscapedTagBody = 8
}

function changeState(curr: StateEnum, symbol: string, nextSymbol: string): StateEnum {
  if (curr === StateEnum.OutOFAllTags && symbol === '<') {
    return StateEnum.InOpeningTag;
  } else if (curr === StateEnum.InOpeningTag && notWhiteSpace(symbol)) {
    if (symbol === '>')
      throw new Error(em.TAGNAME_IS_EMPTY());
    else
      return StateEnum.InTagName;
  } else if (curr === StateEnum.InTagName && isWhiteSpace(symbol)) {
    return StateEnum.InOpeningTagWhiteSpace;
  } else if (curr === StateEnum.InOpeningTagWhiteSpace && isLetter(symbol)) {
    return StateEnum.InAttribute;
  } else if ((curr === StateEnum.InAttribute ||  // <a href='b'>..
    curr === StateEnum.InOpeningTagWhiteSpace || // <a href='b' > && <a  >..
    curr === StateEnum.InTagName) && // <a>..
    notWhiteSpace(symbol) &&
    symbol === '>'
  ) {
    if (parseFlags.isEscaped)
      return StateEnum.InEscapedTagBody;
    else
      return StateEnum.InTagBody;
  } else if (curr === StateEnum.InTagBody && symbol + nextSymbol === '</') {
    return StateEnum.InClosingTag;
  } else if (curr === StateEnum.InTagBody && symbol === '<' && !parseFlags.isEscaped) {
    parseFlags.isNested = true;
  return StateEnum.InOpeningTag;
  } else if (curr === StateEnum.InClosingTag && symbol === '>') {
    if (parseFlags.isNested)
      return StateEnum.InTagBody;
    else
      return StateEnum.OutOFAllTags;
  } else {
    return curr;
  }
}

export class MarkupParser implements mp.MarkupParser {
  public opts: mp.ParserOptions;

  constructor(opts: mp.ParserOptions) {
    this.opts = opts;
  }

  parse(raw: string): mp.MarkupTree {
    if (!this.opts)
      throw new Error('Options not set. Please provide a correct opts object.');

    const { selfCLosingTags, nop } = this.opts;
    let ret = <mp.MarkupTree>{
      root: nop.init(),
      selfCLosingTags: selfCLosingTags,
      variables: null
    };
    ret.root.tagName = ROOT_TAG_NAME;

    let input = raw.split('\n');
    let state = StateEnum.OutOFAllTags;
    let currNode: mp.ElementNode = ret.root;

    for (let i = 0; i < input.length; i++) {
      for (let j = 0; j < input[i].length; j++) {
        try {
          let symbol = input[i][j];
          let nextSymbol = input[i][j + 1];
          let prevState = state;
          let notInTag;

          state = changeState(state, symbol, nextSymbol);
          const stateStr = StateEnum[state];
          const prevStateStr = StateEnum[prevState];
          notInTag = [
            StateEnum.InTagBody,
            StateEnum.OutOFAllTags,
            StateEnum.InEscapedTagBody
          ].indexOf(state) >= 0;

          if (state === StateEnum.InOpeningTag && symbol === '<') {
            let newEl: mp.ElementNode = nop.init();
            nop.add(currNode, newEl);
            currNode = newEl;
          } else if (symbol + nextSymbol === '/>' && !notInTag) {
            if (selfCLosingTags.indexOf(currNode.tagName) >= 0) {
              if (currNode.parent.tagName === ROOT_TAG_NAME) parseFlags.isNested = false;
              currNode = currNode.parent;
            } else {
              throw new Error(em.UNEXPECTED_SEQUENCE('/>'))
            }
          } else if (symbol === '>' && notInTag) {
            if (prevState === StateEnum.InClosingTag ||
              selfCLosingTags.indexOf(currNode.tagName) >= 0
            ) {
              if (currNode.parent.tagName === ROOT_TAG_NAME) parseFlags.isNested = false;
              currNode = currNode.parent;
            }
          } else if (state === StateEnum.InTagName && notWhiteSpace(symbol)) {
            currNode.tagName += symbol;
          } else if (state === StateEnum.InAttribute) {
            currNode.attrBuffer += symbol;
          } else if (state === StateEnum.InTagBody && prevState === StateEnum.InTagBody) {
            nop.addText(currNode, symbol);
          }
        } catch (err) {
          throw new Error(em.ERROR_ON_LINE(i + 1, j + 1, err.message))
        }
      }
    }

    return ret;
  }
}