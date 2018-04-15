import { MarkupParser } from './markup_parser';
import { nop } from './node_operator';

const parser = new MarkupParser({
  selfCLosingTags: ['img'],
  nop: nop
});
const ret = parser.parse(`<a >the< b >BASIC</ b>example </a> <i>this is in the root!</i>`);
const html = nop.toHtml(ret);
console.log(html === `<a>the<b>BASIC</b>example </a><i>this is in the root!</i>`);
console.log('');

/*
  Re-write the toHtml with templates.
*/

/* Add escaped tags. */

/*
  Add variable support.
    `<declare key="Test" value="nope">`
    `$(Test) => nope`
*/