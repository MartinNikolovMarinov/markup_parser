import { MarkupParser } from './markup_parser';
import { nop } from './node_operator';

const parser = new MarkupParser({
  selfCLosingTags: ['img'],
  nop: nop
});
const input = `<declare key="a" value=b>`;
const ret = parser.parse(input);
const html = nop.toHtml(ret);
console.log(html);

/*
!!
  Figure out how to render the tree ??
  Make the generated output a SPA app, instead of linking html pages. Ya dunce.
!!
*/