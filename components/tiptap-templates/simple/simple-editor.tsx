'use client';

import { Emoji, gitHubEmojis } from '@tiptap/extension-emoji';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import { Typography } from '@tiptap/extension-typography';
import { Placeholder, Selection } from '@tiptap/extensions';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { createPortal } from 'react-dom';
// --- Tiptap Core Extensions ---
import { UiState } from '@/components/tiptap-extension/ui-state-extension';
import { HorizontalRule } from '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension';
// --- Tiptap Node ---
import { ImageUploadNode } from '@/components/tiptap-node/image-upload-node/image-upload-node-extension';
// --- UI Primitives ---
import '@/components/tiptap-node/blockquote-node/blockquote-node.scss';
import '@/components/tiptap-node/code-block-node/code-block-node.scss';
import '@/components/tiptap-node/heading-node/heading-node.scss';
import '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss';
import '@/components/tiptap-node/image-node/image-node.scss';
import '@/components/tiptap-node/list-node/list-node.scss';
import '@/components/tiptap-node/paragraph-node/paragraph-node.scss';

// --- Icons ---
// --- Components ---
import { DragContextMenu } from '@/components/tiptap-ui/drag-context-menu';
// --- Tiptap UI ---
import { EmojiDropdownMenu } from '@/components/tiptap-ui/emoji-dropdown-menu';
import { SlashDropdownMenu } from '@/components/tiptap-ui/slash-dropdown-menu';
// --- Hooks ---

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from '@/lib/tiptap-utils';

// --- Styles ---
import '@/components/tiptap-templates/simple/simple-editor.scss';

import React from 'react';
import content from '@/components/tiptap-templates/simple/data/content.json' with {
  type: 'json',
};
import { NotionEditorHeader } from './notion-like-editor-header';
import { MobileToolbar } from './notion-like-editor-mobile-toolbar';
import { NotionToolbarFloating } from './notion-like-editor-toolbar-floating';

/**
 * Loading spinner component shown while connecting to the notion server
 */
export function LoadingSpinner({ text = 'Connecting...' }: { text?: string }) {
  return (
    <div className="spinner-container">
      <div className="spinner-content">
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>Connecting...</title>
          <circle cx="12" cy="12" r="10" />
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <div className="spinner-loading-text">{text}</div>
      </div>
    </div>
  );
}

/**
 * EditorContent component that renders the actual editor
 */
export function EditorContentArea() {
  const { editor } = React.useContext(EditorContext);

  if (!editor) {
    return null;
  }

  return (
    <EditorContent
      className="simple-editor-content"
      editor={editor}
      role="presentation"
      style={{
        cursor: editor.view.dragging ? 'grabbing' : 'auto',
      }}
    >
      <DragContextMenu />
      <EmojiDropdownMenu />
      <SlashDropdownMenu />
      <NotionToolbarFloating />

      {createPortal(<MobileToolbar />, document.body)}
    </EditorContent>
  );
}
export type EditorProviderProps = {
  placeholder: string;
};
export function SimpleEditor({ placeholder }: EditorProviderProps) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        'aria-label': 'Main content area, start typing to enter text.',
        class: 'simple-editor',
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      UiState,
      HorizontalRule,
      Placeholder.configure({
        placeholder,
        emptyNodeClass: 'is-empty with-slash',
      }),
      Emoji.configure({
        emojis: gitHubEmojis.filter(
          (emoji) => !emoji.name.includes('regional')
        ),
        forceFallbackImages: true,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      Color,
      TextStyle,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: 'image/*',
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        // onError: (error) => console.error('Upload failed:', error),
      }),
    ],
    content,
  });

  if (!editor) {
    return <LoadingSpinner />;
  }

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <NotionEditorHeader />
        <EditorContentArea />
      </EditorContext.Provider>
    </div>
  );
}
