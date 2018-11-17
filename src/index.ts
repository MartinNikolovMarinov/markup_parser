import { MarkupParser } from './markup_parser';
// import { nop } from './node_operator';

// const parser = new MarkupParser({
//   selfCLosingTags: ['img'],
//   nop: nop
// });
// const input = `
// <html>
//   <head>
//     <title>Sample "Hello, World" Application</title>
//   </head>
//   <body bgcolor=white>

//     <table border="0" cellpadding="10">
//       <tr>
//         <td>
//           <img src="images/springsource.png">
//         </td>
//         <td>
//           <h1>Sample "Hello, World" Application</h1>
//         </td>
//       </tr>
//     </table>

//     <p>This is the home page for the HelloWorld Web application. </p>
//     <p>To prove that they work, you can execute either of the following links:
//     <ul>
//       <li>To a <a href="hello.jsp">JSP page</a>.
//       <li>To a <a href="hello">servlet</a>.
//     </ul>
//     <ul>
//       <li>To a <a href="hello.jsp">JSP page</a>.
//       <li>To a <a href="hello">servlet</a>.
//     </ul>
//     <ul>
//       <li>To a <a href="hello.jsp">JSP page</a>.
//       <li>To a <a href="hello">servlet</a>.
//     </ul>
//   </body>
// </html>`;

// const ret = parser.parse(input);
// const html = nop.toHtml(ret);
// console.log(html);

export { MarkupParser };