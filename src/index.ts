import { MarkupParser } from './markup_parser';
import { nop } from './node_operator';

let parser = new MarkupParser({
  selfCLosingTags: ['img'],
  nop: nop
});
let ret = parser.parse(`<p src=T>TEST</p>`);
let html = nop.toHtml(ret);
console.log(html);

/*
  Setup tests for :

  <img src=TEST>
  <img src=T>
  <img src=TEST oneMore="\"\"" attr="'TESTING'">
  <img  />
  <a >the< b >BASIC</ b>example </a> <i>this is in the root!</i>

  Errors :
  <img
  <img src=>
  <img src>
  <img src=asd zxx>
  <img src='asd">
  <a>Tss<b>TEST</b></p>
*/

/*
  Re-write the toHtml with templates.
*/

/* Add escaped tags. */

/*
  Add variable support.
    `<declare key="Test" value="nope">`
    `$(Test) => nope`
*/