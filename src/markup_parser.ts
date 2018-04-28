import { ROOT_TAG_NAME } from './constants';
import {
  errorMessages as em,
  isLetter,
  isWhiteSpace,
  notWhiteSpace,
} from './util';

const reserved = {
  DECLARE: 'declare'
};

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
  InClosingTag = 7 // (found </)
}

enum AttrParseState {
  OutOfAttr = 1,
  InAttrName = 2,
  InAttrValue = 3
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
  if (notWhiteSpace(scProps.symbol) && scProps.symbol === '>') return StateEnum.InTagBody;
  if (isWhiteSpace(scProps.symbol)) return StateEnum.InOpeningTagWhiteSpace;
  return scProps.curr;
};
parseStates[StateEnum.InOpeningTagWhiteSpace] = (scProps) => {
  if (notWhiteSpace(scProps.symbol) && scProps.symbol === '>') return StateEnum.InTagBody;
  if (isLetter(scProps.symbol)) return StateEnum.InAttribute;
  return scProps.curr;
};
parseStates[StateEnum.InAttribute] = (scProps) => {
  if (notWhiteSpace(scProps.symbol) && scProps.symbol === '>') return StateEnum.InTagBody;
  if (notWhiteSpace(scProps.symbol)) return StateEnum.InAttribute;
  return scProps.curr;
};
parseStates[StateEnum.InTagBody] = (scProps) => {
  if (scProps.symbol + scProps.nextSymbol === '</') return StateEnum.InClosingTag;
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

    if (scProps.parseFlags.isNested || scProps.parseFlags.isEscaped) return StateEnum.InTagBody;
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

    if (selfCLosingTags.indexOf('declare') === -1) {
      selfCLosingTags.push('declare');
    }

    const ret = <mp.MarkupTree> {
      root: nop.init(),
      selfCLosingTags: selfCLosingTags,
      variables: []
    };
    ret.root.tagName = ROOT_TAG_NAME;

    let state: StateEnum = StateEnum.OutOFAllTags;
    let currNode: mp.ElementNode = ret.root;
    let attrBuffer = '';
    let closingTagBuffer = '';

    for (let i = 0; i < input.length; i++) {
      for (let j = 0; j < input[i].length; j++) {
        try {
          const symbol = input[i][j];
          const nextSymbol = input[i][j + 1];
          const prevState: StateEnum = state;

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

          // Closing Tag checks :
          if (prevState === StateEnum.InClosingTag && prevState !== state) {
            const closingTag: string = this.trimClosingTagBuffer(closingTagBuffer);
            const tagsAreMatching: boolean = closingTag === currNode.tagName;
            if (parseFlags.isEscaped) {
              if (tagsAreMatching) {
                parseFlags.isEscaped = false;
                closingTagBuffer = '';
                currNode = currNode.parent;
                if (currNode.tagName === ROOT_TAG_NAME) {
                  state = StateEnum.OutOFAllTags;
                }
              } else {
                nop.addText(currNode, closingTagBuffer + symbol);
                closingTagBuffer = '';
              }
            } else {
              if (!tagsAreMatching) throw new Error(em.TAG_MISMATCH());
              closingTagBuffer = '';
              currNode = currNode.parent;
            }
          }
          // Nest a new element :
          // tslint:disable-next-line:one-line
          else if (state === StateEnum.InOpeningTag && symbol === '<') {
            const newEl: mp.ElementNode = nop.init();
            nop.add(currNode, newEl);
            currNode = newEl;
          }
          // Extract attributes :
          // tslint:disable-next-line:one-line
          else if (symbol + nextSymbol === '/>' && this.inOpeningTag(prevState)) {
            if (this.isSelfClosing(currNode.tagName)) {
              this.extractAttrs(currNode, attrBuffer, parseFlags);
              if (parseFlags.isEscaped) throw new Error(em.ESCAPED_SELF_CLOSING_TAG());
              if (!currNode.parent) throw new Error(em.UNEXPECTED_ERROR());

              if (currNode.tagName === reserved.DECLARE) {
                let keyAttr: mp.Attribute;
                let valueAttr: mp.Attribute;
                currNode.attributes.forEach((x: mp.Attribute) => {
                  if (x.key === 'key') keyAttr = x;
                  if (x.key === 'value') valueAttr = x;
                });

                if (keyAttr === undefined) throw new Error(em.INVALID_VARIABLE_DECLARATION());
                if (valueAttr === undefined) throw new Error(em.INVALID_VARIABLE_DECLARATION());
                ret.variables.push(<mp.Tuple<string, string>> {
                  key: keyAttr.value,
                  value: valueAttr.value
                });
              }

              attrBuffer = '';
              currNode = currNode.parent;
              state = parseFlags.isNested ? StateEnum.InTagBody : StateEnum.OutOFAllTags;
              j++;
            } else {
              throw new Error(em.UNEXPECTED_SEQUENCE('/>'));
            }
          } else if (symbol === '>' && this.inOpeningTag(prevState)) {
            if (this.isSelfClosing(currNode.tagName)) {
              this.extractAttrs(currNode, attrBuffer, parseFlags);
              if (parseFlags.isEscaped) throw new Error(em.ESCAPED_SELF_CLOSING_TAG());
              if (!currNode.parent) throw new Error(em.UNEXPECTED_ERROR());

              if (currNode.tagName === reserved.DECLARE) {
                let keyAttr: mp.Attribute;
                let valueAttr: mp.Attribute;
                currNode.attributes.forEach((x: mp.Attribute) => {
                  if (x.key === 'key') keyAttr = x;
                  if (x.key === 'value') valueAttr = x;
                });

                if (keyAttr === undefined) throw new Error(em.INVALID_VARIABLE_DECLARATION());
                if (valueAttr === undefined) throw new Error(em.INVALID_VARIABLE_DECLARATION());
                ret.variables.push(<mp.Tuple<string, string>> {
                  key: keyAttr.value,
                  value: valueAttr.value
                });
              }

              attrBuffer = '';
              currNode = currNode.parent;
              state = parseFlags.isNested ? StateEnum.InTagBody : StateEnum.OutOFAllTags;
            } else {
              this.extractAttrs(currNode, attrBuffer, parseFlags);
              attrBuffer = '';
            }
          }
          // Write symbol to one of the buffers :
          // tslint:disable-next-line:one-line
          else if (state === StateEnum.InTagName && notWhiteSpace(symbol)) {
            currNode.tagName += symbol;
          } else if (state === StateEnum.InAttribute) {
            attrBuffer += symbol;
          } else if (state === StateEnum.InClosingTag) {
            closingTagBuffer += symbol;
          } else if (state === StateEnum.InTagBody && prevState === StateEnum.InTagBody) {
            nop.addText(currNode, symbol);
          }
        } catch (err) {
          throw new Error(em.ERROR_ON_LINE(i + 1, j + 1, err.message));
        }
      }

      if (i < input.length - 1) {
        nop.addText(currNode, '\n');
      }
    }

    if (state !== StateEnum.OutOFAllTags) {
      throw new Error(em.TAG_FORMATTING_ERR());
    }

    return ret;
  }

  private inOpeningTag(state: StateEnum): boolean {
    return state === StateEnum.InOpeningTag ||
      state === StateEnum.InOpeningTagWhiteSpace ||
      state === StateEnum.InAttribute ||
      state === StateEnum.InTagName;
  }

  private isSelfClosing(tagName: string): boolean {
    return this.opts.selfCLosingTags.indexOf(tagName) >= 0;
  }

  private trimClosingTagBuffer(tag: string): string {
    let trimmed;
    if (tag.length < 3) return '';
    else if (tag[0] + tag[1] === '</') trimmed = tag.substr(2, tag.length);
    else throw new Error(em.UNEXPECTED_ERROR());

    return trimmed.trim();
  }

  // TODO: Works fine, but could be refactored with Enums and other types.
  // Mini state machine for attribute extraction :
  private extractAttrs(
    currNode: mp.ElementNode,
    attrBuffer: string,
    parseFlags: ParseFlags
  ): void {
    attrBuffer = attrBuffer.trim();
    if (attrBuffer === '') return;

    let currKey = '';
    let currValue = '';
    let currDelimiter = '';
    let currState: AttrParseState = AttrParseState.InAttrName;

    for (let i = 0; i < attrBuffer.length; i++) {
      const symbol = attrBuffer[i];
      const nextSymbol = attrBuffer[i + 1];

      if (currState === AttrParseState.OutOfAttr) {
        if (notWhiteSpace(symbol)) currState = AttrParseState.InAttrName;
        else continue;
      }

      if (currState === AttrParseState.InAttrName) {
        if (symbol + nextSymbol === '="') {
          currDelimiter = '"';
          currState = AttrParseState.InAttrValue;
          i++;
        } else if (symbol + nextSymbol === `='`) {
          currDelimiter = `'`;
          currState = AttrParseState.InAttrValue;
          i++;
        } else if (symbol === '=') {
          currDelimiter = ' ';
          currState = AttrParseState.InAttrValue;
        } else if (/\w+/.test(symbol)) {
          currKey += symbol;
        } else {
          throw new Error(em.INVALID_ATTRIBUTE_KEY());
        }
      } else if (currState === AttrParseState.InAttrValue) {
        if (currKey === '') throw new Error(em.INVALID_ATTRIBUTE_KEY());

        const dumbSpecialCase = (currDelimiter === ' ' && nextSymbol === undefined);
        if (symbol === currDelimiter || dumbSpecialCase) {
          if (dumbSpecialCase && notWhiteSpace(symbol)) currValue += symbol;
          currNode.attributes.push(<mp.Attribute> {
            key: currKey,
            value: currValue,
            delimiter: currDelimiter
          });

          if (currKey === 'escaped') parseFlags.isEscaped = (currValue === 'true');

          currDelimiter = '';
          currKey = '';
          currValue = '';
          currState = AttrParseState.OutOfAttr;
        } else {
          currValue += symbol;
        }
      }
    }

    if (currState !== AttrParseState.OutOfAttr) {
      currNode.attributes.push(<mp.Attribute> {
        key: currKey,
        value: currValue,
        delimiter: currDelimiter
      });
    }
  }
}