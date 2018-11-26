import { ROOT_TAG_NAME } from '../constants';
import { isElementNode } from '../util';

function extractAttr(node: mp.ElementNode) {
  if (node.attributes.length <= 0) return '';

  let attributesStr = ' ';
  for (let i = 0; i < node.attributes.length; i++) {
    const attr = node.attributes[i];
    const printedDelimiter = attr.delimiter === ' ' ? '' : attr.delimiter;
    if (i === node.attributes.length - 1) {
      attributesStr += `${attr.key}=${printedDelimiter}${attr.value}${printedDelimiter}`;
    } else {
      attributesStr += `${attr.key}=${printedDelimiter}${attr.value}${printedDelimiter} `;
    }
  }

  return attributesStr;
}

export class HtmlTransform implements mp.NodeTransform<string> {
  private buffer: string = '';

  public transform(tree: mp.MarkupTree): string {
    this.buffer = '';
    this.toHtml(tree.root, tree.selfCLosingTags);
    return this.buffer;
  }

  private toHtml(node: mp.ElementNode, selfClosingTags: string[]): void {
    const openTag = `<${node.tagName}${extractAttr(node)}>`;
    const closeTag = `</${node.tagName}>`;

    if (selfClosingTags.indexOf(node.tagName) >= 0) {
      this.buffer += openTag;
      return;
    }

    if (node.tagName !== ROOT_TAG_NAME) this.buffer += openTag;
    for (const c of node.children) {
      if (isElementNode(c)) {
        this.toHtml(c as mp.ElementNode, selfClosingTags);
      } else {
        this.buffer += (c as mp.TextNode).content;
      }
    }
    if (node.tagName !== ROOT_TAG_NAME) this.buffer += closeTag;
  }
}