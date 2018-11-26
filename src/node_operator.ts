import { isElementNode } from './util';

class NodeOperator implements mp.NodeOperator {
  public init(): mp.ElementNode {
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

  public deepCopy(node: mp.ElementNode): mp.ElementNode {
    if (!node) throw new Error('Undefined node argument.');
    const len = node.children.length;
    const newNode = this.init();
    newNode.attributes = this.copyAttributes(node.attributes);
    newNode.parent = node.parent;
    newNode.tagName = node.tagName;

    for (let i = 0; i < len; i++) {
      const c: mp.MarkupNode = node.children[i];
      if (isElementNode(c)) {
        this._deepCopy(c as mp.ElementNode, newNode);
      } else {
        this.addText(newNode, (c as mp.TextNode).content);
      }
    }

    return newNode;
  }

  private _deepCopy(node: mp.ElementNode, copyNode: mp.ElementNode): void {
    const len = node.children.length;
    const newNode = this.init();
    newNode.attributes = this.copyAttributes(node.attributes);
    newNode.parent = copyNode;
    newNode.tagName = node.tagName;
    copyNode.children.push(newNode);

    for (let i = 0; i < len; i++) {
      const c: mp.MarkupNode = node.children[i];
      if (isElementNode(c)) {
        this._deepCopy(c as mp.ElementNode, newNode);
      } else {
        this.addText(newNode, (c as mp.TextNode).content);
      }
    }
  }

  private copyAttributes(attrs: mp.Attribute[]) {
    const copy: mp.Attribute[] = [];
    for (const a of attrs) {
      copy.push(<mp.Attribute> { delimiter: a.delimiter, key: a.key, value: a.value });
    }
    return copy;
  }
}

export const nop = new NodeOperator();