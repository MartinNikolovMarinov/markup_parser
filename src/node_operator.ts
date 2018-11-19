import { isElementNode } from './util';

class NodeOperator implements mp.NodeOperator {
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
}

export const nop = new NodeOperator();