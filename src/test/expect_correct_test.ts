// tslint:disable-next-line:no-reference
/// <reference path="../global.d.ts" />

import { MarkupParser } from '../markup_parser';
import { nop } from '../node_operator';
import { assert, expect } from 'chai';

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
    const result = nop.toHtml(tree);

    expect(tree.root.children.length).is.eq(1);
    expect(result).is.eq('<img>');
  });

  it('Two self closing tags on the same level.', () => {
    // USE TO BE A BUG.
    const input = `<img/><img/>`;
    const tree = mp.parse(input);
    const result = nop.toHtml(tree);

    expect(tree.root.children.length).is.eq(2);
    expect(result).is.eq(`<img><img>`);
  });

  it('Self closing tag with "no bracket" attribute.', () => {
    const input = `<img src=TEST>`;
    const tree = mp.parse(input);
    const result = nop.toHtml(tree);
    const firstChild = getFirstChild(tree.root);

    expect(firstChild.attributes.length).is.eq(1);
    expect(result).is.eq(input);
  });

  it('Self closing tag with "no bracket" attribute that\'s just one symbol long.', () => {
    // USE TO BE A BUG.
    const input = `<img src=T>`;
    const tree = mp.parse(input);
    const result = nop.toHtml(tree);
    const firstChild = getFirstChild(tree.root);

    expect(firstChild.attributes.length).is.eq(1);
    expect(result).is.eq(input);
  });

  it('Multiple attributes with different bracket styles.', () => {
    const input = `<img src=TEST oneMore="'Testing'" attr="'TESTING'">`;
    const tree = mp.parse(input);
    const result = nop.toHtml(tree);
    const firstChild = getFirstChild(tree.root);

    expect(firstChild.attributes.length).is.eq(3);
    expect(result).is.eq(input);
  });

  it('Empty attribute value should be allowed.', () => {
    const input = `<a href=""></a>`;
    const tree = mp.parse(input);
    const result = nop.toHtml(tree);
    expect(result).is.eq(input);
  });

  it('Basic nested tag example, with white spaces in odd places.', () => {
    const input = `<a >the< b >BASIC</img b>example </a> <i>this is in the root!</i>`;
    const tree = mp.parse(input);
    const result = nop.toHtml(tree);
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
    const result = nop.toHtml(tree);
    const firstChild = getFirstChild(tree.root);

    expect(tree.root.children.length).is.eq(1);
    expect(firstChild.children.length).is.eq(1);
    expect(firstChild.children[0] as mp.TextNode).has.property('content', 'T<a>Escaped</a>T');
    expect(result).is.eq(`<p escaped=true href="other attrs">T<a>Escaped</a>T</p>`);
  });

  it('Escaped = false attribute.', () => {
    const input = `<p escaped='false'>T<a>NOT Escaped</a>T</p>`;
    const tree = mp.parse(input);
    const result = nop.toHtml(tree);
    const firstChild = getFirstChild(tree.root);

    expect(tree.root.children.length).is.eq(1);
    expect(firstChild.children.length).is.eq(3);
    expect(firstChild.children[0] as mp.TextNode).has.property('content', 'T');
    expect(firstChild.children[1] as mp.ElementNode).does.not.have.property('content');
    expect(firstChild.children[2] as mp.TextNode).has.property('content', 'T');
    expect(result).is.eq(`<p escaped='false'>T<a>NOT Escaped</a>T</p>`);
  });
});

function getFirstChild(node: mp.ElementNode): mp.ElementNode {
  assert(node.children[0] as mp.ElementNode);
  return node.children[0] as mp.ElementNode;
}