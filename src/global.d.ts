declare global {
  namespace mp {
    interface MarkupParser {
      opts: mp.ParserOptions;
      parse(input: string): MarkupTree;
    }

    interface ParserOptions {
      selfCLosingTags: string[],
      nop: mp.NodeOperator,
    }

    interface Tuple<Key, Val> {
      key: Key,
      value: Val,
    }

    interface MarkupTree {
      root: ElementNode;
      variables: Tuple<string, string>[];
      selfCLosingTags: string[];
    }

    interface MarkupNode {
      parent: ElementNode;
    }

    interface ElementNode extends MarkupNode {
      tagName: string;
      attrBuffer: string;
      attributes: Tuple<string, string>[];
      children: Array<MarkupNode>;
    }

    interface TextNode extends MarkupNode {
      content: string;
    }

    interface NodeOperator {
      init(opts?: any) : ElementNode;
      add(p: ElementNode, c: MarkupNode): void;
      addText(n: mp.ElementNode, text: string): void;
      traverse(n: ElementNode, order: "pre" | "post", callback: (n: MarkupNode) => void): void;
      toHtml(node: mp.MarkupTree): string;
    }
  }
}

export {}; // TS magic !?