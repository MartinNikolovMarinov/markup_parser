import { ROOT_TAG_NAME } from './constants';
import { isElementNode } from './util';

let buffer: string = '';

function _toHtml(node: mp.ElementNode, selfClosingTags: string[]): void {
  const openTag = `<${node.tagName}${extractAttr(node)}>`;
  const closeTag = `</${node.tagName}>`;

  if (selfClosingTags.indexOf(node.tagName) >= 0) {
    buffer += openTag;
    return;
  }

  if (node.tagName !== ROOT_TAG_NAME) buffer += openTag;
  for (const c of node.children) {
    if (isElementNode(c)) {
      _toHtml(c as mp.ElementNode, selfClosingTags);
    } else {
      buffer += (c as mp.TextNode).content;
    }
  }
  if (node.tagName !== ROOT_TAG_NAME) buffer += closeTag;
}

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

export function toHtml(tree: mp.MarkupTree): string {
  buffer = '';
  _toHtml(tree.root, tree.selfCLosingTags);
  return buffer;
}