import { MarkupParser } from './markup_parser';
import { nop } from './node_operator';

const parser = new MarkupParser({
  selfCLosingTags: ['img'],
  nop: nop
});
const input = `
<declare key=2 value=15>
<declare key="2" value='15'/>

<html>
  <head>
    <title>Sample "Hello, World" Application</title>
  </head>
  <body bgcolor=white>
    <h1>TTT</h1>
  </body>
</html>`;

const ret = parser.parse(input);
const html = nop.toHtml(ret, ['declare']);
console.log(html);

/*
!!
  Figure out how to render the tree ??
  Make the generated output a SPA app, instead of linking html pages. Ya dunce.
!!
*/