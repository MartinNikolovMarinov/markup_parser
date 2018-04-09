import { MarkupParser } from './markup_parser';

let parser = new MarkupParser();
parser.config(null);
parser.parse('<a>YO</a> <b></b> <c>T<d>EX</d>T</c>');

/*
  Add self closing tags.
  Add escaped tags.
  Add variable support.
*/