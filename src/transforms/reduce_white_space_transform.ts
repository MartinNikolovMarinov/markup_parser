import { nop } from '../node_operator';
import { isElementNode, notWhiteSpace } from '../util';

function removeWhiteSpace(textNode: mp.TextNode): string {
  const len = textNode.content.length;
  let content = '';
  for (let i = 1; i < len - 1; i++) {
    if (
      notWhiteSpace(textNode.content[i - 1]) &&
      ['<', '>'].indexOf(textNode.content[i - 1]) < 0 &&
      notWhiteSpace(textNode.content[i + 1]) &&
      ['<', '>'].indexOf(textNode.content[i + 1]) < 0
    ) {
      content += textNode.content[i];
    }
  }

  return content.trim();
}

function minifyText(node: mp.ElementNode): void {
  for (const c of node.children) {
    if (isElementNode(c)) {
      minifyText(c as mp.ElementNode);
    } else {
      const textNode = c as mp.TextNode;
      textNode.content = removeWhiteSpace(textNode);
    }
  }
}

export class ReduceWhiteSpaceTransform implements mp.NodeTransform<mp.MarkupTree> {
  public transform(tree: mp.MarkupTree): mp.MarkupTree {
    const root = nop.deepCopy(tree.root);
    minifyText(root);
    tree.root = root;
    return tree;
  }
}