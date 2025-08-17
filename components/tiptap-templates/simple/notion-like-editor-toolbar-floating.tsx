import { type Editor, isNodeSelection } from '@tiptap/react';
import React from 'react';
// --- Icons ---
import { MoreVerticalIcon } from '@/components/tiptap-icons/more-vertical-icon';
// --- UI ---
import { ColorTextPopover } from '@/components/tiptap-ui/color-text-popover';
import { LinkPopover } from '@/components/tiptap-ui/link-popover';
import type { Mark } from '@/components/tiptap-ui/mark-button';
import { canToggleMark, MarkButton } from '@/components/tiptap-ui/mark-button';
import type { TextAlign } from '@/components/tiptap-ui/text-align-button';
import {
  canSetTextAlign,
  TextAlignButton,
} from '@/components/tiptap-ui/text-align-button';
import { TurnIntoDropdown } from '@/components/tiptap-ui/turn-into-dropdown';
// --- Primitive UI Components ---
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button';
import { Button } from '@/components/tiptap-ui-primitive/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/tiptap-ui-primitive/popover';
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from '@/components/tiptap-ui-primitive/toolbar';
// --- UI Utils ---
import { FloatingElement } from '@/components/tiptap-ui-utils/floating-element';
import { useIsMobile } from '@/hooks/use-mobile';
// --- Hooks ---
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';
import { useUiEditorState } from '@/hooks/use-ui-editor-state';
// --- Utils ---
import { isSelectionValid } from '@/lib/tiptap-collab-utils';

export function NotionToolbarFloating() {
  const { editor } = useTiptapEditor();
  const isMobile = useIsMobile(480);
  const { lockDragHandle, aiGenerationActive, commentInputVisible } =
    useUiEditorState(editor);
  const [shouldShow, setShouldShow] = React.useState(false);

  React.useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { state } = editor;
      const { selection } = state;

      const validSelection =
        isSelectionValid(editor, selection) &&
        (!isNodeSelection(selection) ||
          (isNodeSelection(selection) && selection.node.type.name === 'image'));

      if (commentInputVisible || aiGenerationActive) {
        setShouldShow(false);
        return;
      }

      setShouldShow(validSelection);
    };

    handleSelectionUpdate();

    editor.on('selectionUpdate', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, aiGenerationActive, commentInputVisible]);

  if (lockDragHandle || isMobile) {
    return null;
  }

  return (
    <FloatingElement shouldShow={shouldShow}>
      <Toolbar variant="floating">
        <ToolbarSeparator />

        <ToolbarGroup>
          <TurnIntoDropdown hideWhenUnavailable={true} />
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <MarkButton hideWhenUnavailable={true} type="bold" />
          <MarkButton hideWhenUnavailable={true} type="italic" />
          <MarkButton hideWhenUnavailable={true} type="strike" />
          <MarkButton hideWhenUnavailable={true} type="code" />
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <LinkPopover
            autoOpenOnLinkActive={false}
            hideWhenUnavailable={true}
          />
          <ColorTextPopover hideWhenUnavailable={true} />
        </ToolbarGroup>

        <MoreOptions hideWhenUnavailable={true} />
      </Toolbar>
    </FloatingElement>
  );
}

function canMoreOptions(editor: Editor | null): boolean {
  if (!editor) {
    return false;
  }

  const canTextAlignAny = ['left', 'center', 'right', 'justify'].some((align) =>
    canSetTextAlign(editor, align as TextAlign)
  );

  const canMarkAny = ['superscript', 'subscript'].some((type) =>
    canToggleMark(editor, type as Mark)
  );

  return canMarkAny || canTextAlignAny;
}

function shouldShowMoreOptions(params: {
  editor: Editor | null;
  hideWhenUnavailable: boolean;
}): boolean {
  const { editor, hideWhenUnavailable } = params;

  if (!editor) {
    return false;
  }

  if (hideWhenUnavailable && !editor.isActive('code')) {
    return canMoreOptions(editor);
  }

  return Boolean(editor?.isEditable);
}

export interface MoreOptionsProps extends Omit<ButtonProps, 'type'> {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null;
  /**
   * Whether to hide the dropdown when no options are available.
   * @default false
   */
  hideWhenUnavailable?: boolean;
}

export function MoreOptions({
  editor: providedEditor,
  hideWhenUnavailable = false,
  ...props
}: MoreOptionsProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      setShow(
        shouldShowMoreOptions({
          editor,
          hideWhenUnavailable,
        })
      );
    };

    handleSelectionUpdate();

    editor.on('selectionUpdate', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, hideWhenUnavailable]);

  if (!(show && editor && editor.isEditable)) {
    return null;
  }

  return (
    <>
      <ToolbarSeparator />
      <ToolbarGroup>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              data-style="ghost"
              role="button"
              tabIndex={-1}
              tooltip="More options"
              type="button"
              {...props}
            >
              <MoreVerticalIcon className="tiptap-button-icon" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            alignOffset={4}
            asChild
            side="top"
            sideOffset={4}
          >
            <Toolbar tabIndex={0} variant="floating">
              <ToolbarGroup>
                <MarkButton type="superscript" />
                <MarkButton type="subscript" />
              </ToolbarGroup>

              <ToolbarSeparator />

              <ToolbarGroup>
                <TextAlignButton align="left" />
                <TextAlignButton align="center" />
                <TextAlignButton align="right" />
                <TextAlignButton align="justify" />
              </ToolbarGroup>

              <ToolbarSeparator />
            </Toolbar>
          </PopoverContent>
        </Popover>
      </ToolbarGroup>
    </>
  );
}
