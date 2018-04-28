import { MarkupParser } from './markup_parser';
import { nop } from './node_operator';

const parser = new MarkupParser({
  selfCLosingTags: ['img'],
  nop: nop
});
const ret = parser.parse(`<img escaped="true"/> <p>TT</p>`);
const html = nop.toHtml(ret);
console.log(html);

/**
 * Think about tag mismatch error handling :
 * <a><p></p></c>
 */

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