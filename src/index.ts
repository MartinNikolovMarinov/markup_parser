import { MarkupParser } from './markup_parser';
import { nop } from './node_operator';

const parser = new MarkupParser({
  selfCLosingTags: ['img'],
  nop: nop
});
const ret = parser.parse(`<a>TT</ a>`);
const html = nop.toHtml(ret);

/*
  Add variable support.
    `<declare key="Test" value="nope">`
    `$(Test) => nope`
*/

/**
 * Think about tag mismatch error handling :
 * <a><p></p></c>
 */

/*
  Re-write the toHtml with templates.
*/

 /*
!!
  Make the generated output a SPA app, instead of linking html pages. Ya dunce.
!!
*/