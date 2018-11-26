// tslint:disable-next-line:no-reference
/// <reference path="../global.d.ts" />

import { MarkupParser } from '../markup_parser';
import { nop } from '../node_operator';
import { TransformPipe } from '../transform_pipe';
import { HtmlTransform } from '../transforms/html_transform';
import { assert, expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

describe('Correctness Tests', () => {
  let mp: MarkupParser;

  before(() => {
    mp = new MarkupParser(<mp.ParserOptions> {
      nop: nop,
      selfCLosingTags: ['img']
    });
  });

  it('Self closing empty tag.', () => {
    const input = `<img  />`;
    const tree = mp.parse(input);
    const result = new TransformPipe().add(new HtmlTransform()).apply(tree);

    expect(tree.root.children.length).is.eq(1);
    expect(result).is.eq('<img>');
  });

  it('Two self closing tags on the same level.', () => {
    // USE TO BE A BUG.
    const input = `<img/><img/>`;
    const tree = mp.parse(input);
    const result = new TransformPipe().add(new HtmlTransform()).apply(tree);

    expect(tree.root.children.length).is.eq(2);
    expect(result).is.eq(`<img><img>`);
  });

  it('Self closing tag with "no bracket" attribute.', () => {
    const input = `<img src=TEST>`;
    const tree = mp.parse(input);
    const result = new TransformPipe().add(new HtmlTransform()).apply(tree);
    const firstChild = getFirstChild(tree.root);

    expect(firstChild.attributes.length).is.eq(1);
    expect(result).is.eq(input);
  });

  it('Self closing tag with "no bracket" attribute that\'s just one symbol long.', () => {
    // USE TO BE A BUG.
    const input = `<img src=T>`;
    const tree = mp.parse(input);
    const result = new TransformPipe().add(new HtmlTransform()).apply(tree);
    const firstChild = getFirstChild(tree.root);

    expect(firstChild.attributes.length).is.eq(1);
    expect(result).is.eq(input);
  });

  it('Multiple attributes with different bracket styles.', () => {
    const input = `<img src=TEST oneMore="'Testing'" attr="'TESTING'">`;
    const tree = mp.parse(input);
    const result = new TransformPipe().add(new HtmlTransform()).apply(tree);
    const firstChild = getFirstChild(tree.root);

    expect(firstChild.attributes.length).is.eq(3);
    expect(result).is.eq(input);
  });

  it('Empty attribute value should be allowed.', () => {
    const input = `<a href=""></a>`;
    const tree = mp.parse(input);
    const result = new TransformPipe().add(new HtmlTransform()).apply(tree);
    expect(result).is.eq(input);
  });

  it('Empty attribute value with empty space delimiter.', () => {
    const input = '<img src= t=>';
    const tree = mp.parse(input);
    const result = new TransformPipe().add(new HtmlTransform()).apply(tree);
    const firstChild = getFirstChild(tree.root);
    expect(firstChild.attributes.length).is.eq(2);
    expect(result).is.eq(input);
  });

  it('Basic nested tag example, with white spaces in odd places.', () => {
    const input = `<a >the< b >BASIC</b>example </a> <i>this is in the root!</i>`;
    const tree = mp.parse(input);
    const result = new TransformPipe().add(new HtmlTransform()).apply(tree);
    const firstChild = getFirstChild(tree.root);

    expect(tree.root.children.length).is.eq(2);
    expect(firstChild.children.length).is.eq(3);
    expect(firstChild.children[0] as mp.TextNode).has.property('content', 'the');
    expect(firstChild.children[1] as mp.ElementNode).does.not.have.property('content');
    expect(firstChild.children[2] as mp.TextNode).has.property('content', 'example ');
    expect(result).is.eq(`<a>the<b>BASIC</b>example </a><i>this is in the root!</i>`);
  });

  it('Escaped tag with extra attribute.', () => {
    const input = `<p escaped=true href="other attrs">T<a>Escaped</a>T</p>`;
    const tree = mp.parse(input);
    const result = new TransformPipe().add(new HtmlTransform()).apply(tree);
    const firstChild = getFirstChild(tree.root);

    expect(tree.root.children.length).is.eq(1);
    expect(firstChild.children.length).is.eq(1);
    expect(firstChild.children[0] as mp.TextNode).has.property('content', 'T<a>Escaped</a>T');
    expect(result).is.eq(`<p escaped=true href="other attrs">T<a>Escaped</a>T</p>`);
  });

  it('Escaped = false attribute.', () => {
    const input = `<p escaped='false'>T<a>NOT Escaped</a>T</p>`;
    const tree = mp.parse(input);
    const result = new TransformPipe().add(new HtmlTransform()).apply(tree);
    const firstChild = getFirstChild(tree.root);

    expect(tree.root.children.length).is.eq(1);
    expect(firstChild.children.length).is.eq(3);
    expect(firstChild.children[0] as mp.TextNode).has.property('content', 'T');
    expect(firstChild.children[1] as mp.ElementNode).does.not.have.property('content');
    expect(firstChild.children[2] as mp.TextNode).has.property('content', 'T');
    expect(result).is.eq(`<p escaped='false'>T<a>NOT Escaped</a>T</p>`);
  });

  it('Multiline unordered list spacing test.', () => {
    const input = '<ul>\n' +
    '  <li>A</li>\n' +
    '  <li>B</li>\n' +
    '  <li>C</li>\n' +
    '</ul>';

    const tree = mp.parse(input);
    const result = new TransformPipe().add(new HtmlTransform()).apply(tree);
    const firstChild = getFirstChild(tree.root);
    expect(tree.root.children.length).is.eq(1);
    expect(firstChild.children.length).is.eq(7); // White spaces are notes too
    expect(firstChild.children[0] as mp.TextNode).has.property('content', '\n  ');
    expect(firstChild.children[1] as mp.ElementNode).does.not.have.property('content');
    expect(firstChild.children[2] as mp.TextNode).has.property('content', '\n  ');
    expect(firstChild.children[3] as mp.ElementNode).does.not.have.property('content');
    expect(firstChild.children[4] as mp.TextNode).has.property('content', '\n  ');
    expect(firstChild.children[5] as mp.ElementNode).does.not.have.property('content');
    expect(firstChild.children[6] as mp.TextNode).has.property('content', '\n');
    expect(result).is.eq(input);
  });

  it('Multiline unordered list ESCAPED spacing test.', () => {
    const input = '<ul escaped=true>\n' +
    '  <li>A</li>\n' +
    '  <li>B</li>\n' +
    '  <li>C</li>\n' +
    '</ul>';
    const tree = mp.parse(input);
    const result = new TransformPipe().add(new HtmlTransform()).apply(tree);
    const firstChild = getFirstChild(tree.root);

    expect(tree.root.children.length).is.eq(1);
    expect(firstChild.children.length).is.eq(1); // White spaces are notes too
    expect(firstChild.children[0] as mp.TextNode).has.property('content');
    expect(result).is.eq(input);
  });

  it('Simple variable declaration.', () => {
    const input = `<declare key="a" value=b>`;
    const tree = mp.parse(input);
    expect(tree.variables.length).is.eq(1);
    expect(tree.variables[0].key).is.eq('a');
    expect(tree.variables[0].value).is.eq('b');
  });

  it('Long Example.', () => {
    const input = fs.readFileSync(path.resolve(__dirname, 'long_example.html')).toString();
    const tree = mp.parse(input);
    const result = new TransformPipe().add(new HtmlTransform()).apply(tree);
    expect(result).to.eq(input);
  });
});

function getFirstChild(node: mp.ElementNode): mp.ElementNode {
  assert(node.children[0] as mp.ElementNode);
  return node.children[0] as mp.ElementNode;
}