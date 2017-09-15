import React, { Component } from 'react';
import './MagicBookEditor.css';
import '../node_modules/draft-js/dist/Draft.css';
import {Editor, EditorState, RichUtils, convertFromRaw, convertToRaw} from 'draft-js';
import ContentEditable from "react-contenteditable";

const LOCALSTORAGE_TITLE = 'magicbook-title';
const LOCALSTORAGE_CONTENT = 'magicbook-content';
const SAVE_TIMER = 1300;

class MagicBookEditor extends Component {

  constructor(props) {
    super(props);

    this.state = {
      saveState: "Listening",
      editorTitle: this.getEditorTitle(),
      editorState: this.getEditorState()
    };

    this.onContentChange = this._onContentChange.bind(this);
    this.onTitleChange = this._onTitleChange.bind(this);
    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.onTab = this._onTab.bind(this);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
    this.focus = () => this.refs.editor.focus();
  }

  getEditorTitle() {
    const defaultTitle = "Document title";
    const savedTitle = localStorage.getItem(LOCALSTORAGE_TITLE);
    return savedTitle || defaultTitle;
  }

  getEditorState() {
    const stringState = localStorage.getItem(LOCALSTORAGE_CONTENT);
    if(stringState) {
      const jsonState = JSON.parse(stringState);
      const realState = convertFromRaw(jsonState);
      return EditorState.createWithContent(realState);
    }
    return EditorState.createEmpty();
  }

  showSaved() {
    this.setState({saveState: "Saved"})
    setTimeout(() => this.setState({saveState:"Listening"}), 2000);
  }

  save(editorState) {
    const jsonState = convertToRaw(editorState.getCurrentContent());
    const stringState = JSON.stringify(jsonState);
    localStorage.setItem(LOCALSTORAGE_CONTENT, stringState);
    this.showSaved();
  }

  _onTitleChange(e) {
    if(this.titleSaveTimer) clearTimeout(this.titleSaveTimer);
    const title = e.target.value;
    this.titleSaveTimer = setTimeout(() => {
      localStorage.setItem(LOCALSTORAGE_TITLE, title);
      this.showSaved();
    }, SAVE_TIMER);
  }

  _onContentChange(editorState) {
    if(this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(editorState), SAVE_TIMER);
    this.setState({editorState})
  }

  _handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onContentChange(newState);
      return true;
    }
    return false;
  }

  _onTab(e) {
    const maxDepth = 4;
    this.onContentChange(RichUtils.onTab(e, this.state.editorState, maxDepth));
  }

  _toggleBlockType(blockType) {
    this.onContentChange(
      RichUtils.toggleBlockType(
        this.state.editorState,
        blockType
      )
    );
  }

  _toggleInlineStyle(inlineStyle) {
    this.onContentChange(
      RichUtils.toggleInlineStyle(
        this.state.editorState,
        inlineStyle
      )
    );
  }

  render() {

    const {editorState} = this.state;

    return (
      <div className="MagicBookEditor">
        <span className="saveState">{this.state.saveState}</span>
        <ContentEditable tagName="h1" html={this.state.editorTitle} onChange={this.onTitleChange} />
        <div className="Editor" onClick={this.focus}>
          <Editor
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.onContentChange}
            onTab={this.onTab}
            placeholder="Start writing..."
            ref="editor"
            spellCheck={true}
          />
        </div>
      </div>
    );
  }
}

// Custom overrides for "code" style.
const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case 'blockquote': return 'RichEditor-blockquote';
    default: return null;
  }
}

export default MagicBookEditor;
