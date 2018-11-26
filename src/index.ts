import { MarkupParser } from './markup_parser';
import { nop as defaultNodeOperations } from './node_operator';
import { TransformPipe } from './transform_pipe';
import { HtmlTransform } from './transforms/html_transform';

const parser: mp.MarkupParser = new MarkupParser({ selfCLosingTags: ['img'] });
const input = `
<declare key=2 value=15>
<declare key="2" value='15'/>

<html>
  <head>


    <title>Sample "Hello, World" Application</title>
  </head>
  <body   bgcolor=white  >
    <h1>TTT</h1>
  </body>
</html>`;

const tree = parser.parse(input);
const html = new TransformPipe().add(new HtmlTransform()).apply(tree);
console.log(html);

export { MarkupParser, TransformPipe, defaultNodeOperations };
