import { MarkupParser } from './markup_parser';
import { nop as defaultNodeOperations } from './node_operator';

// const parser = new MarkupParser({
//   selfCLosingTags: ['img'],
//   nop: defaultNodeOperations
// });
// const input = `
// <declare key=2 value=15>
// <declare key="2" value='15'/>

// <html>
//   <head>
//     <title>Sample "Hello, World" Application</title>
//   </head>
//   <body bgcolor=white>
//     <h1>TTT</h1>
//   </body>
// </html>`;

// const ret = parser.parse(input);
// const html = defaultNodeOperations.toHtml(ret, ['declare']);

export { MarkupParser, defaultNodeOperations };