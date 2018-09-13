import { ROOT_TAG_NAME } from './constants';

function isElementNode(obj: any) { return 'children' in obj; }

class NodeOperator implements mp.NodeOperator {
  private buffer: string;

  public init(opts?: any): mp.ElementNode {
    return {
      tagName: '',
      children: [],
      parent: null,
      attributes: []
    };
  }

  public add(p: mp.ElementNode, c: mp.MarkupNode): void {
    p.children.push(c);
    c.parent = p;
  }

  public addText(n: mp.ElementNode, text: string): void {
    const cLen = n.children.length;
    if (cLen === 0) {
      n.children.push(<mp.TextNode> { content: text, parent: n });
    } else {
      const lastChild = n.children[cLen - 1];
      if (isElementNode(lastChild)) {
        n.children.push(<mp.TextNode> { content: text, parent: n });
      } else {
        (lastChild as mp.TextNode).content += text;
      }
    }
  }

  public traverse(n: mp.ElementNode, order: 'pre' | 'post', callback: (n: mp.MarkupNode) => void): void {
    const len = n.children.length;
    for (let i = 0; i < len; i++) {
      const c: mp.MarkupNode = n.children[i];
      if (order === 'pre') callback(n);
      if (isElementNode(c)) this.traverse(c as mp.ElementNode, order, callback);
      if (order === 'post') callback(n);
    }
  }

  public toHtml(tree: mp.MarkupTree, ignoreTags?: string[]): string {
    this.buffer = '';
    this._toHtml(tree.root, tree.selfCLosingTags, ignoreTags);
    return this.buffer;
  }

  private _toHtml(
    node: mp.ElementNode,
    selfClosingTags: string[],
    ignoreTags?: string[]
  ): void {
    const openTag = `<${node.tagName}${this.extractAttr(node)}>`;
    const closeTag = `</${node.tagName}>`;

    if (ignoreTags && ignoreTags.indexOf(node.tagName) >= 0) {
      return;
    }

    if (selfClosingTags.indexOf(node.tagName) >= 0) {
      this.buffer += openTag;
      return;
    }

    if (node.tagName !== ROOT_TAG_NAME) this.buffer += openTag;
    for (const c of node.children) {
      if (isElementNode(c)) {
        this._toHtml(c as mp.ElementNode, selfClosingTags, ignoreTags);
      } else {
        this.buffer += (c as mp.TextNode).content;
      }
    }
    if (node.tagName !== ROOT_TAG_NAME) this.buffer += closeTag;
  }

  private extractAttr(node: mp.ElementNode) {
    if (node.attributes.length <= 0) return '';

    let buffer = ' ';
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      const printedDelimiter = attr.delimiter === ' ' ? '' : attr.delimiter;
      if (i === node.attributes.length - 1) {
        buffer += `${attr.key}=${printedDelimiter}${attr.value}${printedDelimiter}`;
      } else {
        buffer += `${attr.key}=${printedDelimiter}${attr.value}${printedDelimiter} `;
      }
    }

    return buffer;
  }
}

export const nop = new NodeOperator();