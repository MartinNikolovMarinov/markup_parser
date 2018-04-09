import { nop } from './node_operator'
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
    if (symbol === '>') throw new Error(em.TAGNAME_IS_EMPTY());
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
    if (parseFlags.isEscaped) return StateEnum.InEscapedTagBody;
    else return StateEnum.InTagBody;
  } else if (curr === StateEnum.InTagBody && symbol + nextSymbol === '</') {
    return StateEnum.InClosingTag;
  } else if (curr === StateEnum.InTagBody && symbol === '<' && !parseFlags.isEscaped) {
    parseFlags.isNested = true;
    return StateEnum.InOpeningTag;
  } else if (curr === StateEnum.InClosingTag && symbol === '>') {
    if (parseFlags.isNested) return StateEnum.InTagBody;
    else return StateEnum.OutOFAllTags;
  } else {
    return curr;
  }
}

export class MarkupParser implements mp.MarkupParser {
  private opts: mp.ParserOptions;

  config(opts: mp.ParserOptions): void {
    this.opts = opts;
  }

  parse(raw: string): mp.MarkupTree {
    let ret = <mp.MarkupTree>{
      root: nop.init(),
      variables: null
    };
    ret.root.tagName = ROOT_TAG_NAME;

    let input = raw.split('\n');
    let state = StateEnum.OutOFAllTags;
    let currNode: mp.ElementNode = ret.root;
    for (let i = 0; i < input.length; i++) {
      for (let j = 0; j < input[i].length; j++) {
        let symbol = input[i][j];
        let nextSymbol = input[i][j + 1];
        let prevState = state;

        try {
          state = changeState(state, symbol, nextSymbol);
        } catch (err) {
          throw Error(em.ERROR_ON_LINE(i + 1, j + 1, err.message))
        }

        if (state === StateEnum.InOpeningTag && symbol === '<') {
          let newEl: mp.ElementNode = nop.init();
          nop.add(currNode, newEl);
          currNode = newEl;
        } else if (prevState === StateEnum.InClosingTag && symbol === '>') {
          if (currNode.parent.tagName === ROOT_TAG_NAME) parseFlags.isNested = false;
          currNode = currNode.parent;
        } else if (state === StateEnum.InTagName && notWhiteSpace(symbol)) {
          currNode.tagName += symbol;
        } else if (state === StateEnum.InAttribute) {
          currNode.attrBuffer += symbol;
        } else if (state === StateEnum.InTagBody && prevState === StateEnum.InTagBody) {
          nop.addText(currNode, symbol);
        }
      }
    }

    let html = nop.toHtml(ret.root);
    console.log(html);
    return ret;
  }
}