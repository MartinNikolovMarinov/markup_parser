// tslint:disable-next-line:no-reference
/// <reference path="../global.d.ts" />
import { MarkupParser } from '../markup_parser';
import { nop } from '../node_operator';
import { errorMessages as em } from '../util';
import { expect } from 'chai';

describe('Error Expecting Tests', () => {
  let mp: MarkupParser;

  before(() => {
    mp = new MarkupParser(<mp.ParserOptions> {
      nop: nop,
      selfCLosingTags: ['img']
    });
  });

  it('Trying to escape self-closing tag.', () => {
    const input = `<img escaped="true"/> <p>TT</p>`;
    expect(() => mp.parse(input)).to.throw(em.ESCAPED_SELF_CLOSING_TAG());
  });

  it('Empty opening tag.', () => {
    const input = `<></p>`;
    expect(() => mp.parse(input)).to.throw(em.TAGNAME_IS_EMPTY());
  });

  it('Only closing tag.', () => {
    const input = `</a>`;
    expect(() => mp.parse(input)).to.throw(em.TAG_FORMATTING_ERR());
  });

  it('No closing bracket in opening tag.', () => {
    const input = `<img`;
    expect(() => mp.parse(input)).to.throw(em.TAG_FORMATTING_ERR());
  });

  it('No closing tag.', () => {
    const input = `<p><p></p>`;
    expect(() => mp.parse(input)).to.throw(em.TAG_FORMATTING_ERR());
  });

  it('Opening tag not closed correctly.', () => {
    const input = `<p </p>`;
    expect(() => mp.parse(input)).to.throw(em.TAG_FORMATTING_ERR());
  });

  it('Opening tag no opening bracket.', () => {
    const input = `p></p>`;
    expect(() => mp.parse(input)).to.throw(em.TAG_FORMATTING_ERR());
  });

  it('Closing tag no closing bracket.', () => {
    const input = `<p></p`;
    expect(() => mp.parse(input)).to.throw(em.TAG_FORMATTING_ERR());
  });

  it('Incorrect number of closing tags.', () => {
    const input = `<p><p></p>`;
    expect(() => mp.parse(input)).to.throw(em.TAG_FORMATTING_ERR());
  });

  it('No closing tag name.', () => {
    const input = `<p></>`;
    expect(() => mp.parse(input)).to.throw(em.TAG_MISMATCH());
  });

  it('Closing tag mismatch', () => {
    const input = `<a><p></p></c>`;
    expect(() => mp.parse(input)).to.throw(em.TAG_MISMATCH());
  });
});