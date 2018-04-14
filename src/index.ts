import { MarkupParser } from './markup_parser';
import { nop } from './node_operator';

let parser = new MarkupParser({
  selfCLosingTags: ['img'],
  nop: nop
});
let ret = parser.parse('<p >ab <img />PACA< img >cd</p  >');
let html = nop.toHtml(ret);
console.log(html);

// `<declare key="Test" value="nope">`
// `$(Test) => nope`

/*
  Add escaped tags.
  Add variable support.
  Templating engine as a last step.
*/