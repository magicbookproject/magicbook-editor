import {stateToHTML} from 'draft-js-export-html';

export default function exportHtmlBook(title, editorState) {
  const content = stateToHTML(editorState.getCurrentContent());
  const html = `<section data-type="chapter">
  <header>
    <h1>${title}</h1>
  </header>
  ${content}
</section>`
  console.log(html)
}
