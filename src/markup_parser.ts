import { ROOT_TAG_NAME } from './constants'
import {
  errorMessages as em,
  isLetter,
  isWhiteSpace,
  notWhiteSpace,
} from './util'

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

type StateCallback = (props: StateChangeProps) => StateEnum;
type ParseFlags = { isEscaped: boolean, isNested: boolean }
type StateChangeProps = {
  curr: StateEnum,
  symbol: string,
  parseFlags: ParseFlags,
  prev: StateEnum,
  nextSymbol: string,
  currNode: mp.ElementNode
}

let parseStates: { [state: number]: StateCallback } = {};

parseStates[StateEnum.OutOFAllTags] = (scProps) => {
  if (scProps.symbol === '<') return StateEnum.InOpeningTag
  else return scProps.curr
};
parseStates[StateEnum.InOpeningTag] = (scProps) => {
  if (notWhiteSpace(scProps.symbol)) {
    if (scProps.symbol === '>') throw new Error(em.TAGNAME_IS_EMPTY());
    else return StateEnum.InTagName;
  }

  return scProps.curr
};
parseStates[StateEnum.InTagName] = (scProps) => {
  if (notWhiteSpace(scProps.symbol) && scProps.symbol === '>') {
    if (scProps.parseFlags.isEscaped) return StateEnum.InEscapedTagBody;
    else return StateEnum.InTagBody;
  }

  if (isWhiteSpace(scProps.symbol)) return StateEnum.InOpeningTagWhiteSpace;

  return scProps.curr
};
parseStates[StateEnum.InOpeningTagWhiteSpace] = (scProps) => {
  if (notWhiteSpace(scProps.symbol) && scProps.symbol === '>') {
    if (scProps.parseFlags.isEscaped) return StateEnum.InEscapedTagBody;
    else return StateEnum.InTagBody;
  }

  if (isLetter(scProps.symbol)) return StateEnum.InAttribute;

  return scProps.curr
};
parseStates[StateEnum.InAttribute] = (scProps) => {
  if (notWhiteSpace(scProps.symbol) && scProps.symbol === '>') {
    if (scProps.parseFlags.isEscaped) return StateEnum.InEscapedTagBody;
    else return StateEnum.InTagBody;
  }

  if (notWhiteSpace(scProps.symbol)) return StateEnum.InAttribute;

  return scProps.curr;
};
parseStates[StateEnum.InTagBody] = (scProps) => {
  if (scProps.symbol + scProps.nextSymbol === '</') {
    return StateEnum.InClosingTag;
  }

  if (scProps.symbol === '<' && !scProps.parseFlags.isEscaped) {
    scProps.parseFlags.isNested = true;
    return StateEnum.InOpeningTag;
  }

  return scProps.curr;
};
parseStates[StateEnum.InClosingTag] = (scProps) => {
  if (scProps.symbol === '>') {
    if (scProps.currNode.parent.tagName === ROOT_TAG_NAME)
      scProps.parseFlags.isNested = false;

    if (scProps.parseFlags.isNested) return StateEnum.InTagBody;
    else return StateEnum.OutOFAllTags;
  }

  return scProps.curr
}

export class MarkupParser implements mp.MarkupParser {
  public opts: mp.ParserOptions;

  constructor(opts: mp.ParserOptions) {
    this.opts = opts;
  }

  parse(raw: string): mp.MarkupTree {
    if (!this.opts)
      throw new Error('Options not set. Please provide a correct opts object.');

    const input = raw.split('\n');
    const { selfCLosingTags, nop } = this.opts;
    const parseFlags: ParseFlags = {
      isEscaped: false,
      isNested: false
    }

    let ret = <mp.MarkupTree>{
      root: nop.init(),
      selfCLosingTags: selfCLosingTags,
      variables: null
    };
    ret.root.tagName = ROOT_TAG_NAME;

    let state = StateEnum.OutOFAllTags;
    let currNode: mp.ElementNode = ret.root;

    for (let i = 0; i < input.length; i++) {
      for (let j = 0; j < input[i].length; j++) {
        try {
          let symbol = input[i][j];
          let nextSymbol = input[i][j + 1];
          let prevState = state;
          let notInTag;

          state = parseStates[state].call(this, <StateChangeProps>{
            curr: state,
            prev: prevState,
            symbol: symbol,
            nextSymbol: nextSymbol,
            currNode: currNode,
            parseFlags: parseFlags
          });

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
            if (this.isSelfClosing(currNode.tagName)) {
              // this.extractAttributes(currNode);
              currNode = currNode.parent;
            } else {
              throw new Error(em.UNEXPECTED_SEQUENCE('/>'))
            }
          } else if (symbol === '>' && notInTag) {
            const inClosing = (prevState === StateEnum.InClosingTag);
            if (inClosing || this.isSelfClosing(currNode.tagName)) {
              // this.extractAttributes(currNode);
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

  private isSelfClosing (tagName: string): boolean {
    return this.opts.selfCLosingTags.indexOf(tagName) >= 0;
  }
}