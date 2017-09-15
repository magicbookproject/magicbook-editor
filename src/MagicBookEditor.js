import React, { Component } from 'react';
import './MagicBookEditor.css';
import '../node_modules/draft-js/dist/Draft.css';
import {Editor, EditorState, RichUtils, Modifier, convertFromRaw, convertToRaw} from 'draft-js';
import ContentEditable from "react-contenteditable";
import isSoftNewlineEvent from 'draft-js/lib/isSoftNewlineEvent';
import isListItem from './editor/isListItem';
import insertBlockAfter from './editor/insertBlockAfter';
import exportHtmlBook from './editor/exportHtmlBook';

import {BLOCK_TYPE} from 'draft-js-utils';
const LOCALSTORAGE_TITLE = 'magicbook-title';
const LOCALSTORAGE_CONTENT = 'magicbook-content';
const SAVE_TIMER = 1300;

class MagicBookEditor extends Component {

  constructor(props) {
    super(props);

    this.state = {
      saveState: "Listening",
      editorTitle: this.initialEditorTitle(),
      editorState: this.intialEditorState()
    };

    this.onContentChange = this._onContentChange.bind(this);
    this.onTitleChange = this._onTitleChange.bind(this);
    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.onTab = this._onTab.bind(this);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
    this.handleReturn = this._handleReturn.bind(this);
    this.handleReturnSoftNewline = this._handleReturnSoftNewline.bind(this);
    this.handleReturnSpecialBlock = this._handleReturnSpecialBlock.bind(this);
    this.exportHtmlBook = this._exportHtmlBook.bind(this);
  }

  componentDidMount() {
    this.refs.editor.focus();
  }

  render() {

    const {editorState} = this.state;

    return (
      <div className="MagicBookEditor">
        <span className="saveState">{this.state.saveState}</span>
        <button onClick={this.exportHtmlBook}>Export HTMLBook</button>
        <ContentEditable tagName="h1" html={this.state.editorTitle} onChange={this.onTitleChange} />
        <div className="Editor" onClick={this.focus}>
          <Editor
            blockStyleFn={this.blockStyleFn}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            handleReturn={this.handleReturn}
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

  // Load / Save / Export
  // ------------------------------------------------------

  initialEditorTitle() {
    const defaultTitle = "Document title";
    const savedTitle = localStorage.getItem(LOCALSTORAGE_TITLE);
    return savedTitle || defaultTitle;
  }

  intialEditorState() {
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

  _exportHtmlBook() {
    exportHtmlBook(this.state.editorTitle, this.state.editorState);
  }

  // Editor functions
  // -----------------------------------------------------------

  _handleReturn(event) {
    if (this._handleReturnSoftNewline(event)) {
      return true;
    }
    if (this._handleReturnSpecialBlock()) {
      return true;
    }
    return false;
  }

  // `shift + return` should insert a soft newline.
  _handleReturnSoftNewline(event) {
    if (isSoftNewlineEvent(event)) {
      let selection = this.state.editorState.getSelection();
      if(selection.isCollapsed()) {
        this.onContentChange(RichUtils.insertSoftNewline(this.state.editorState));
      }
      else {
        let content = this.state.editorState.getCurrentContent();
        let newContent = Modifier.removeRange(content, selection, 'forward');
        let newSelection = newContent.getSelectionAfter();
        let block = newContent.getBlockForKey(newSelection.getStartKey());
        newContent = Modifier.insertText(
          newContent,
          newSelection,
          '\n',
          block.getInlineStyleAt(newSelection.getStartOffset()),
          null,
        );
        this.onContentChange(EditorState.push(this.state.editorState, newContent, 'insert-fragment'));
      }
      return true;
    }
    return false;
  }

  blockStyleFn(block) {
    const type = block.getType();
    if(type === 'unstyled')        return 'paragraph'
    else if(type === 'blockquote') return 'blockquote'
    else if(type === 'code-block') return 'code'
  }

  // If the cursor is at the end of a special block (any block type other than
  // normal or list item) when return is pressed, new block should be normal.
  _handleReturnSpecialBlock() {
    let selection = this.state.editorState.getSelection();
    if (selection.isCollapsed()) {
      let contentState = this.state.editorState.getCurrentContent();
      let blockKey = selection.getStartKey();
      let block = contentState.getBlockForKey(blockKey);
      if (!isListItem(block) && block.getType() !== BLOCK_TYPE.UNSTYLED) {
        // If cursor is at end.
        if (block.getLength() === selection.getStartOffset()) {
          let newEditorState = insertBlockAfter(
            this.state.editorState,
            blockKey,
            BLOCK_TYPE.UNSTYLED
          );
          this.onContentChange(newEditorState);
          return true;
        }
      }
    }
    return false;
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


export default MagicBookEditor;
