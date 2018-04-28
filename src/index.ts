import { MarkupParser } from './markup_parser';
import { nop } from './node_operator';

const parser = new MarkupParser({
  selfCLosingTags: ['img'],
  nop: nop
});
const input = '<ul escaped=true>\n' +
'  <li>A</li>\n' +
'  <li>B</li>\n' +
'  <li>C</li>\n' +
'</ul>';
const ret = parser.parse(input);
const html = nop.toHtml(ret);
console.log(html);

/*
  Re-write the toHtml with templates.
*/

/*
  Add variable support.
    `<declare key="Test" value="nope">`
    `$(Test) => nope`
*/

/*
!!
  Make the generated output a SPA app, instead of linking html pages. Ya dunce.
!!
*/