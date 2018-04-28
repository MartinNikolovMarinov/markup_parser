import { MarkupParser } from './markup_parser';
import { nop } from './node_operator';

const parser = new MarkupParser({
  selfCLosingTags: ['img'],
  nop: nop
});
const ret = parser.parse(`<p escaped=true href="other attrs">T<a>Escaped</a>T</p>`);
const html = nop.toHtml(ret);
console.log(html);

/*
  Add variable support.
    `<declare key="Test" value="nope">`
    `$(Test) => nope`
*/

/*
  Re-write the toHtml with templates.
*/

 /*
!!
  Make the generated output a SPA app, instead of linking html pages. Ya dunce.
!!
*/