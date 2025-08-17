'use client';

// --- Tiptap UI ---
import { UndoRedoButton } from '@/components/tiptap-ui/undo-redo-button';
import { ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import { Separator } from '@/components/tiptap-ui-primitive/separator';
// --- UI Primitives ---
import { Spacer } from '@/components/tiptap-ui-primitive/spacer';

// --- Styles ---
import './notion-like-editor-header.scss';
import { ThemeToggle } from './theme-toggle';

export function NotionEditorHeader() {
  return (
    <header className="notion-like-editor-header">
      <Spacer />
      <div className="notion-like-editor-header-actions">
        <ButtonGroup orientation="horizontal">
          <UndoRedoButton action="undo" />
          <UndoRedoButton action="redo" />
        </ButtonGroup>

        <Separator />

        <ThemeToggle />
      </div>
    </header>
  );
}
