import React, { Component } from 'react';
import './MagicBookEditor.css';
import '../node_modules/draft-js/dist/Draft.css';
import {Editor, EditorState, RichUtils, convertFromRaw, convertToRaw} from 'draft-js';

class MagicBookEditor extends Component {

  constructor(props) {
    super(props);

    // Load state from local storage
    const title = localStorage.getItem('magicbook-title');
    const content = localStorage.getItem('magicbook-content');

    this.state = {
      saveState: "Listening",
      title: title || "Document title",
      editorState: content ? convertFromRaw(content) : EditorState.createEmpty()
    };

    this.focus = () => this.refs.editor.focus();
    this.onChange = this._onChange.bind(this);
    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.onTab = this._onTab.bind(this);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
  }

  save(editorState) {
    localStorage.setItem('magicbook-content', convertToRaw(editorState));
    this.setState({saveState: "Saved"})
    setTimeout(() => this.setState({saveState:"Listening"}), 2000);
  }

  _onChange(editorState) {
    if(this.saveTimer) clearTimeout(this.saveTimer);
    setTimeout(() => this.save(editorState), 1500);
    this.setState({editorState})
  }

  _handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  }

  _onTab(e) {
    const maxDepth = 4;
    this.onChange(RichUtils.onTab(e, this.state.editorState, maxDepth));
  }

  _toggleBlockType(blockType) {
    this.onChange(
      RichUtils.toggleBlockType(
        this.state.editorState,
        blockType
      )
    );
  }

  _toggleInlineStyle(inlineStyle) {
    this.onChange(
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
        {this.state.saveState}
        <h1>{this.state.title}</h1>
        <div className="Editor" onClick={this.focus}>
          <Editor
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.onChange}
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
