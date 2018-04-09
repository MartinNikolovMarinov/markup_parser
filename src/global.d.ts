declare global {
  namespace mp {
    interface MarkupParser {
      config(opts: ParserOptions): void;
      parse(input: string): MarkupTree;
    }

    interface ParserOptions {
      ignoreVariables: boolean;
    }

    interface Tuple<Key, Val> {
      key: Key,
      value: Val,
    }

    interface MarkupTree {
      root: ElementNode;
      variables: Tuple<string, string>[];
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
      traverse(n: ElementNode, order: "pre" | "post", callback: (n: MarkupNode) => void): void;
      toHtml(node: mp.ElementNode): string;
    }
  }
}

export {}; // TS magic !?