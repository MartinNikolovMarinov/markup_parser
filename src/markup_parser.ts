import { ROOT_TAG_NAME } from './constants';
import {
  errorMessages as em,
  isLetter,
  isWhiteSpace,
  notWhiteSpace,
} from './util';

interface ParseFlags {
  isEscaped: boolean;
  isNested: boolean;
}

interface StateChangeProps {
  curr: StateEnum;
  symbol: string;
  parseFlags: ParseFlags;
  prev: StateEnum;
  nextSymbol: string;
  currNode: mp.ElementNode;
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

type StateCallback = (props: StateChangeProps) => StateEnum;

const parseStates: { [state: number]: StateCallback } = {};

parseStates[StateEnum.OutOFAllTags] = (scProps) => {
  if (scProps.symbol === '<') return StateEnum.InOpeningTag;
  else return scProps.curr;
};
parseStates[StateEnum.InOpeningTag] = (scProps) => {
  if (notWhiteSpace(scProps.symbol)) {
    if (scProps.symbol === '>') throw new Error(em.TAGNAME_IS_EMPTY());
    else return StateEnum.InTagName;
  }

  return scProps.curr;
};
parseStates[StateEnum.InTagName] = (scProps) => {
  if (notWhiteSpace(scProps.symbol) && scProps.symbol === '>') {
    if (scProps.parseFlags.isEscaped) return StateEnum.InEscapedTagBody;
    else return StateEnum.InTagBody;
  }

  if (isWhiteSpace(scProps.symbol)) return StateEnum.InOpeningTagWhiteSpace;

  return scProps.curr;
};
parseStates[StateEnum.InOpeningTagWhiteSpace] = (scProps) => {
  if (notWhiteSpace(scProps.symbol) && scProps.symbol === '>') {
    if (scProps.parseFlags.isEscaped) return StateEnum.InEscapedTagBody;
    else return StateEnum.InTagBody;
  }

  if (isLetter(scProps.symbol)) return StateEnum.InAttribute;

  return scProps.curr;
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
    if (scProps.currNode.parent.tagName === ROOT_TAG_NAME) {
      scProps.parseFlags.isNested = false;
    }

    if (scProps.parseFlags.isNested) return StateEnum.InTagBody;
    else return StateEnum.OutOFAllTags;
  }

  return scProps.curr;
};

export class MarkupParser implements mp.MarkupParser {
  public opts: mp.ParserOptions;

  constructor(opts: mp.ParserOptions) {
    this.opts = opts;
  }

  public parse(raw: string): mp.MarkupTree {
    if (!this.opts) throw new Error('Options not set. Please provide a correct opts object.');

    const input = raw.split('\n');
    const { selfCLosingTags, nop } = this.opts;
    const parseFlags: ParseFlags = {
      isEscaped: false,
      isNested: false
    };

    const ret = <mp.MarkupTree> {
      root: nop.init(),
      selfCLosingTags: selfCLosingTags,
      variables: null
    };
    ret.root.tagName = ROOT_TAG_NAME;

    let state = StateEnum.OutOFAllTags;
    let currNode: mp.ElementNode = ret.root;
    let attrBuffer = '';

    for (let i = 0; i < input.length; i++) {
      for (let j = 0; j < input[i].length; j++) {
        try {
          const symbol = input[i][j];
          const nextSymbol = input[i][j + 1];
          const prevState = state;

          state = parseStates[state].call(this, <StateChangeProps> {
            curr: state,
            prev: prevState,
            symbol: symbol,
            nextSymbol: nextSymbol,
            currNode: currNode,
            parseFlags: parseFlags
          });

          const stateStr = StateEnum[state];
          const prevStateStr = StateEnum[prevState];
          const notInTag = [
            StateEnum.InTagBody,
            StateEnum.OutOFAllTags,
            StateEnum.InEscapedTagBody
          ].indexOf(state) >= 0;

          if (state === StateEnum.InOpeningTag && symbol === '<') {
            const newEl: mp.ElementNode = nop.init();
            nop.add(currNode, newEl);
            currNode = newEl;
          } else if (symbol + nextSymbol === '/>' && !notInTag) {
            if (this.isSelfClosing(currNode.tagName)) {
              this.extractAttrs(currNode, attrBuffer);
              attrBuffer = '';
              currNode = currNode.parent;
            } else {
              throw new Error(em.UNEXPECTED_SEQUENCE('/>'));
            }
          } else if (symbol === '>' && notInTag) {
            const inClosing = (prevState === StateEnum.InClosingTag);
            if (inClosing || this.isSelfClosing(currNode.tagName)) {
              this.extractAttrs(currNode, attrBuffer);
              attrBuffer = '';
              currNode = currNode.parent;
            }
          } else if (state === StateEnum.InTagName && notWhiteSpace(symbol)) {
            currNode.tagName += symbol;
          } else if (state === StateEnum.InAttribute) {
            attrBuffer += symbol;
          } else if (state === StateEnum.InTagBody && prevState === StateEnum.InTagBody) {
            nop.addText(currNode, symbol);
          }
        } catch (err) {
          throw new Error(em.ERROR_ON_LINE(i + 1, j + 1, err.message));
        }
      }
    }

    return ret;
  }

  private isSelfClosing(tagName: string): boolean {
    return this.opts.selfCLosingTags.indexOf(tagName) >= 0;
  }

  // TODO: Works fine, but could be refactored with Enums and other types.
  // Mini state machine for attribute extraction :
  private extractAttrs(currNode: mp.ElementNode, attrBuffer: string): void {
    attrBuffer = attrBuffer.trim();
    if (attrBuffer === '') return;

    let currKey = '';
    let currValue = '';
    let currDelimiter = '';
    let currState = 1;

    for (let i = 0; i < attrBuffer.length; i++) {
      const symbol = attrBuffer[i];
      const nextSymbol = attrBuffer[i + 1];

      if (currState === 0) {
        if (notWhiteSpace(symbol)) currState = 1;
        else continue;
      }

      if (currState === 1) {
        if (symbol + nextSymbol === '="') {
          currDelimiter = '"';
          currState = 2;
          i++;
        } else if (symbol + nextSymbol === `='`) {
          currDelimiter = `'`;
          currState = 2;
          i++;
        } else if (symbol === '=') {
          currDelimiter = ' ';
          currState = 2;
        } else if (/\w+/.test(symbol)) {
          currKey += symbol;
        } else {
          throw new Error(em.INVALID_ATTRIBUTE_KEY());
        }
      } else if (currState === 2) {
        if (currKey === '') throw new Error(em.INVALID_ATTRIBUTE_KEY());

        const dumbSpecialCase = (currDelimiter === ' ' && nextSymbol === undefined);
        if (symbol === currDelimiter || dumbSpecialCase) {
          if (dumbSpecialCase && notWhiteSpace(symbol)) currValue += symbol;
          if (currValue === '') throw new Error(em.INVALID_ATTRIBUTE_VALUE());
          currNode.attributes.push(<mp.Attribute> {
            key: currKey,
            value: currValue,
            delimiter: currDelimiter
          });
          currDelimiter = '';
          currKey = '';
          currValue = '';
          currState = 0;
        } else {
          currValue += symbol;
        }
      }
    }
  }
}