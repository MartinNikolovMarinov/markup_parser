declare global {
  namespace mp {
    interface MarkupParser {
      opts: mp.ParserOptions;
      parse(input: string): MarkupTree;
    }

    interface ParserOptions {
      selfCLosingTags: string[]
    }

    interface Tuple<Key, Val> {
      key: Key,
      value: Val
    }

    interface Attribute {
      key: string,
      value: string,
      delimiter: ' ' | '"' | '\''
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
      attributes: Attribute[];
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
    }
  }
}

export {}; // TS magic !?