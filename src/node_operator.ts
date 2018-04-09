import { ROOT_TAG_NAME } from './constants'

function isElementNode(obj: any) { return 'children' in obj; }

let buffer: string;
function _toHtml(node: mp.ElementNode) {
  const openTag = `<${node.tagName}>`;
  const closeTag = `</${node.tagName}>`;

  if (node.tagName !== ROOT_TAG_NAME) buffer += openTag;
  for (let i = 0; i < node.children.length; i++) {
    let c = node.children[i];
    if (isElementNode(c))
      _toHtml(c as mp.ElementNode);
    else
      buffer += (c as mp.TextNode).content;
  }
  if (node.tagName !== ROOT_TAG_NAME) buffer += closeTag;
}

class NodeOperator implements mp.NodeOperator {
  init(opts?: any): mp.ElementNode {
    return {
      tagName: '',
      children: [],
      parent: null,
      attrBuffer: '',
      attributes: []
    }
  }

  add(p: mp.ElementNode, c: mp.MarkupNode): void {
    p.children.push(c);
    c.parent = p;
  }

  addText(n: mp.ElementNode, text: string): void {
    const cLen = n.children.length;
    if (cLen === 0) {
      n.children.push(<mp.TextNode>{ content: text, parent: n });
    } else {
      let lastChild = n.children[cLen - 1];
      if (isElementNode(lastChild))
        n.children.push(<mp.TextNode>{ content: text, parent: n });
      else
        (lastChild as mp.TextNode).content += text;
    }
  }

  traverse(n: mp.ElementNode, order: 'pre' | 'post', callback: (n: mp.MarkupNode) => void): void {
    const len = n.children.length
    for (let i = 0; i < len; i++) {
      const c: mp.MarkupNode = n.children[i];
      if (order === 'pre') callback(n);
      if (isElementNode(c)) this.traverse(c as mp.ElementNode, order, callback);
      if (order === 'post') callback(n);
    }
  }

  toHtml(node: mp.ElementNode): string {
    buffer = '';
    _toHtml(node);
    return buffer;
  }
}

export const nop = new NodeOperator();