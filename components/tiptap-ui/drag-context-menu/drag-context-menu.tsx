'use client';

import { offset } from '@floating-ui/react';
import { DragHandle } from '@tiptap/extension-drag-handle-react';
import type { Node as TiptapNode } from '@tiptap/pm/model';
import * as React from 'react';
import { ChevronRightIcon } from '@/components/tiptap-icons/chevron-right-icon';
// Icons
import { GripVerticalIcon } from '@/components/tiptap-icons/grip-vertical-icon';
import { PaintBucketIcon } from '@/components/tiptap-icons/paint-bucket-icon';
import { Repeat2Icon } from '@/components/tiptap-icons/repeat-2-icon';
import { TextColorSmallIcon } from '@/components/tiptap-icons/text-color-small-icon';
import {
  AskAiShortcutBadge,
  useAiAsk,
} from '@/components/tiptap-ui/ai-ask-button';
import { useBlockquote } from '@/components/tiptap-ui/blockquote-button';
import { useCodeBlock } from '@/components/tiptap-ui/code-block-button';
import {
  HIGHLIGHT_COLORS,
  useColorHighlight,
} from '@/components/tiptap-ui/color-highlight-button';
import {
  TEXT_COLORS,
  useColorText,
} from '@/components/tiptap-ui/color-text-button';
import type { RecentColor } from '@/components/tiptap-ui/color-text-popover';
import {
  getColorByValue,
  useRecentColors,
} from '@/components/tiptap-ui/color-text-popover';
import {
  CopyAnchorLinkShortcutBadge,
  useCopyAnchorLink,
} from '@/components/tiptap-ui/copy-anchor-link-button';
import {
  CopyToClipboardShortcutBadge,
  useCopyToClipboard,
} from '@/components/tiptap-ui/copy-to-clipboard-button';
import {
  DeleteNodeShortcutBadge,
  useDeleteNode,
} from '@/components/tiptap-ui/delete-node-button';
import {
  DuplicateShortcutBadge,
  useDuplicate,
} from '@/components/tiptap-ui/duplicate-button';
import { useHeading } from '@/components/tiptap-ui/heading-button';
// Tiptap UI
import { useImageDownload } from '@/components/tiptap-ui/image-download-button';
import { useList } from '@/components/tiptap-ui/list-button';
import { useResetAllFormatting } from '@/components/tiptap-ui/reset-all-formatting-button';
import { SlashCommandTriggerButton } from '@/components/tiptap-ui/slash-command-trigger-button';
import { useText } from '@/components/tiptap-ui/text-button';
// Primitive UI Components
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import {
  Combobox,
  ComboboxList,
} from '@/components/tiptap-ui-primitive/combobox';
import {
  Menu,
  MenuButton,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
} from '@/components/tiptap-ui-primitive/menu';
import { Separator } from '@/components/tiptap-ui-primitive/separator';
import { Spacer } from '@/components/tiptap-ui-primitive/spacer';
import { useIsMobile } from '@/hooks/use-mobile';
// Hooks
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';
import { useUiEditorState } from '@/hooks/use-ui-editor-state';
// Utils
import {
  getNodeDisplayName,
  isTextSelectionValid,
} from '@/lib/tiptap-collab-utils';
import { useMenuActionVisibility } from './drag-context-menu-hooks';
import type {
  ColorMenuItemProps,
  DragContextMenuProps,
  MenuItemProps,
  NodeChangeData,
} from './drag-context-menu-types';

const SR_ONLY = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
} as const;

const useNodeTransformActions = () => {
  const text = useText();
  const heading1 = useHeading({ level: 1 });
  const heading2 = useHeading({ level: 2 });
  const heading3 = useHeading({ level: 3 });
  const bulletList = useList({ type: 'bulletList' });
  const orderedList = useList({ type: 'orderedList' });
  const taskList = useList({ type: 'taskList' });
  const blockquote = useBlockquote();
  const codeBlock = useCodeBlock();

  const mapper = (
    action: ReturnType<
      | typeof useText
      | typeof useHeading
      | typeof useList
      | typeof useBlockquote
      | typeof useCodeBlock
    >
  ) => ({
    icon: action.Icon,
    label: action.label,
    onClick: action.handleToggle,
    disabled: !action.canToggle,
    isActive: action.isActive,
  });

  return [
    mapper(text),
    ...[heading1, heading2, heading3].map(mapper),
    mapper(bulletList),
    mapper(orderedList),
    mapper(taskList),
    mapper(blockquote),
    mapper(codeBlock),
  ];
};

const BaseMenuItem: React.FC<MenuItemProps> = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  isActive = false,
  shortcutBadge,
}) => (
  <MenuItem
    disabled={disabled}
    onClick={onClick}
    render={
      <Button data-active-state={isActive ? 'on' : 'off'} data-style="ghost" />
    }
  >
    <Icon className="tiptap-button-icon" />
    <span className="tiptap-button-text">{label}</span>
    {shortcutBadge}
  </MenuItem>
);

const SubMenuTrigger: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}> = ({ icon: Icon, label, children }) => (
  <Menu
    placement="right"
    trigger={
      <MenuItem
        render={
          <MenuButton
            render={
              <Button data-style="ghost">
                <Icon className="tiptap-button-icon" />
                <span className="tiptap-button-text">{label}</span>
                <Spacer />
                <ChevronRightIcon className="tiptap-button-icon" />
              </Button>
            }
          />
        }
      />
    }
  >
    <MenuContent portal>
      <ComboboxList style={{ width: 'fit-content' }}>{children}</ComboboxList>
    </MenuContent>
  </Menu>
);

const TextColorMenuItem: React.FC<ColorMenuItemProps> = ({ color }) => {
  const { addRecentColor } = useRecentColors();
  const { isActive, handleColorText, label } = useColorText({
    label: color.label,
    textColor: color.value,
    onApplied: ({ color, label }) =>
      addRecentColor({ type: 'text', label, value: color }),
  });

  return (
    <MenuItem
      onClick={handleColorText}
      render={
        <Button
          data-active-state={isActive ? 'on' : 'off'}
          data-style="ghost"
        />
      }
    >
      <span className="tiptap-button-color-text" style={{ color: color.value }}>
        <TextColorSmallIcon
          className="tiptap-button-icon"
          style={{ color: color.value, flexGrow: 1 }}
        />
      </span>
      <span className="tiptap-button-text">{label}</span>
    </MenuItem>
  );
};

const HighlightColorMenuItem: React.FC<ColorMenuItemProps> = ({ color }) => {
  const { addRecentColor } = useRecentColors();
  const { isActive, handleColorHighlight, label } = useColorHighlight({
    label: color.label,
    highlightColor: color.value,
    onApplied: ({ color, label }) =>
      addRecentColor({ type: 'highlight', label, value: color }),
  });

  return (
    <MenuItem
      onClick={handleColorHighlight}
      render={
        <Button
          data-active-state={isActive ? 'on' : 'off'}
          data-style="ghost"
        />
      }
    >
      <span
        className="tiptap-button-highlight"
        style={{ '--highlight-color': color.value } as React.CSSProperties}
      />
      <span className="tiptap-button-text">{label}</span>
    </MenuItem>
  );
};

const RecentColorMenuItem: React.FC<{
  colorObj: RecentColor;
}> = ({ colorObj }) => {
  const colorSet = colorObj.type === 'text' ? TEXT_COLORS : HIGHLIGHT_COLORS;
  const color = getColorByValue(colorObj.value, colorSet);

  const ColorComponent =
    colorObj.type === 'text' ? TextColorMenuItem : HighlightColorMenuItem;

  return <ColorComponent color={color} />;
};

const ColorActionGroup: React.FC = () => {
  const { recentColors, isInitialized } = useRecentColors();

  return (
    <SubMenuTrigger icon={PaintBucketIcon} label="Color">
      {/* Recent Colors */}
      {isInitialized && recentColors.length > 0 && (
        <MenuGroup>
          <MenuGroupLabel>Recent colors</MenuGroupLabel>
          {recentColors.map((colorObj) => (
            <RecentColorMenuItem colorObj={colorObj} key={colorObj.value} />
          ))}
          <Separator orientation="horizontal" />
        </MenuGroup>
      )}

      {/* Text Colors */}
      <MenuGroup>
        <MenuGroupLabel>Text color</MenuGroupLabel>
        {TEXT_COLORS.map((textColor) => (
          <TextColorMenuItem color={textColor} key={textColor.value} />
        ))}
      </MenuGroup>

      <Separator orientation="horizontal" />

      {/* Highlight Colors */}
      <MenuGroup>
        <MenuGroupLabel>Highlight color</MenuGroupLabel>
        {HIGHLIGHT_COLORS.map((highlightColor) => (
          <HighlightColorMenuItem
            color={highlightColor}
            key={highlightColor.value}
          />
        ))}
      </MenuGroup>
    </SubMenuTrigger>
  );
};

const TransformActionGroup: React.FC = () => {
  const actions = useNodeTransformActions();
  return (
    <SubMenuTrigger icon={Repeat2Icon} label="Turn Into">
      <MenuGroup>
        <MenuGroupLabel>Turn into</MenuGroupLabel>
        {actions.map((action) => (
          <BaseMenuItem key={action.label} {...action} />
        ))}
      </MenuGroup>
    </SubMenuTrigger>
  );
};

const ResetFormattingAction: React.FC = () => {
  const { canReset, handleResetFormatting, label, Icon } =
    useResetAllFormatting({
      hideWhenUnavailable: true,
      preserveMarks: ['inlineThread'],
    });

  return (
    <BaseMenuItem
      disabled={!canReset}
      icon={Icon}
      label={label}
      onClick={handleResetFormatting}
    />
  );
};

const ImageActionGroup: React.FC = () => {
  const { canDownload, handleDownload, label, Icon } = useImageDownload({
    hideWhenUnavailable: true,
  });

  return (
    <>
      <BaseMenuItem
        disabled={!canDownload}
        icon={Icon}
        label={label}
        onClick={handleDownload}
      />

      <Separator orientation="horizontal" />
    </>
  );
};

const CoreActionGroup: React.FC = () => {
  const {
    handleDuplicate,
    canDuplicate,
    label,
    Icon: DuplicateIcon,
  } = useDuplicate();
  const {
    handleCopyToClipboard,
    canCopyToClipboard,
    label: copyLabel,
    Icon: CopyIcon,
  } = useCopyToClipboard();
  const {
    handleCopyAnchorLink,
    canCopyAnchorLink,
    label: copyAnchorLinkLabel,
    Icon: CopyAnchorLinkIcon,
  } = useCopyAnchorLink();

  return (
    <>
      <MenuGroup>
        <BaseMenuItem
          disabled={!canDuplicate}
          icon={DuplicateIcon}
          label={label}
          onClick={handleDuplicate}
          shortcutBadge={<DuplicateShortcutBadge />}
        />
        <BaseMenuItem
          disabled={!canCopyToClipboard}
          icon={CopyIcon}
          label={copyLabel}
          onClick={handleCopyToClipboard}
          shortcutBadge={<CopyToClipboardShortcutBadge />}
        />
        <BaseMenuItem
          disabled={!canCopyAnchorLink}
          icon={CopyAnchorLinkIcon}
          label={copyAnchorLinkLabel}
          onClick={handleCopyAnchorLink}
          shortcutBadge={<CopyAnchorLinkShortcutBadge />}
        />
      </MenuGroup>

      <Separator orientation="horizontal" />
    </>
  );
};

const AIActionGroup: React.FC = () => {
  const { handleAiAsk, canAiAsk, Icon: AiAskIcon } = useAiAsk();

  if (!canAiAsk) return null;

  return (
    <>
      <MenuGroup>
        {canAiAsk && (
          <BaseMenuItem
            icon={AiAskIcon}
            label="Ask AI"
            onClick={handleAiAsk}
            shortcutBadge={<AskAiShortcutBadge />}
          />
        )}
      </MenuGroup>

      <Separator orientation="horizontal" />
    </>
  );
};

const DeleteActionGroup: React.FC = () => {
  const { handleDeleteNode, canDeleteNode, label, Icon } = useDeleteNode();

  return (
    <MenuGroup>
      <BaseMenuItem
        disabled={!canDeleteNode}
        icon={Icon}
        label={label}
        onClick={handleDeleteNode}
        shortcutBadge={<DeleteNodeShortcutBadge />}
      />
    </MenuGroup>
  );
};

export const DragContextMenu: React.FC<DragContextMenuProps> = ({
  editor: providedEditor,
  withSlashCommandTrigger = true,
  mobileBreakpoint = 768,
  ...props
}) => {
  const { editor } = useTiptapEditor(providedEditor);
  const { aiGenerationActive } = useUiEditorState(editor);
  const isMobile = useIsMobile(mobileBreakpoint);
  const [open, setOpen] = React.useState(false);
  const [node, setNode] = React.useState<TiptapNode | null>(null);
  const [nodePos, setNodePos] = React.useState<number>(-1);

  const handleNodeChange = React.useCallback((data: NodeChangeData) => {
    if (data.node) setNode(data.node);
    setNodePos(data.pos);
  }, []);

  React.useEffect(() => {
    if (!editor) return;
    editor.commands.setLockDragHandle(open);
    editor.commands.setMeta('lockDragHandle', open);
  }, [editor, open]);

  const {
    hasAnyActionGroups,
    hasColorActions,
    hasTransformActions,
    hasResetFormatting,
    hasImage,
  } = useMenuActionVisibility(editor);

  const dynamicPositions = React.useMemo(() => {
    return {
      middleware: [
        offset(({ rects }) => {
          const nodeHeight = rects.reference.height;
          const dragHandleHeight = 32;

          const crossAxis = nodeHeight / 2 - dragHandleHeight / 2;

          return {
            mainAxis: 16,
            // if height is more than 40px, then it's likely a block node
            crossAxis: nodeHeight > 40 ? 0 : crossAxis,
          };
        }),
      ],
    };
  }, []);

  const handleOnMenuClose = React.useCallback(() => {
    if (editor) {
      editor.commands.setMeta('hideDragHandle', true);
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <DragHandle
      computePositionConfig={dynamicPositions}
      editor={editor}
      onNodeChange={handleNodeChange}
      {...props}
    >
      <ButtonGroup
        orientation="horizontal"
        style={{
          ...(aiGenerationActive || isMobile || isTextSelectionValid(editor)
            ? { opacity: 0, pointerEvents: 'none' }
            : {}),
        }}
      >
        {withSlashCommandTrigger && (
          <SlashCommandTriggerButton
            data-weight="small"
            node={node}
            nodePos={nodePos}
          />
        )}

        <Menu
          onOpenChange={setOpen}
          open={open}
          placement="left"
          trigger={
            <MenuButton
              render={
                <Button
                  data-style="ghost"
                  data-weight="small"
                  onMouseDown={() => {
                    if (!editor) return;
                    editor.commands.setNodeSelection(nodePos);
                  }}
                  style={{
                    cursor: 'grab',
                    ...(open ? { pointerEvents: 'none' } : {}),
                  }}
                  tabIndex={-1}
                  tooltip={
                    <>
                      <div>Click for options</div>
                      <div>Hold for drag</div>
                    </>
                  }
                >
                  <GripVerticalIcon className="tiptap-button-icon" />
                </Button>
              }
            />
          }
        >
          <MenuContent
            autoFocusOnHide={false}
            onClose={handleOnMenuClose}
            portal
            preventBodyScroll={true}
          >
            <Combobox style={SR_ONLY} />
            <ComboboxList style={{ minWidth: '15rem' }}>
              <MenuGroup>
                <MenuGroupLabel>{getNodeDisplayName(editor)}</MenuGroupLabel>
                {hasColorActions && <ColorActionGroup />}
                {hasTransformActions && <TransformActionGroup />}
                {hasResetFormatting && <ResetFormattingAction />}
                {hasImage && <ImageActionGroup />}
              </MenuGroup>

              {hasAnyActionGroups && <Separator orientation="horizontal" />}

              <CoreActionGroup />

              <AIActionGroup />

              <DeleteActionGroup />
            </ComboboxList>
          </MenuContent>
        </Menu>
      </ButtonGroup>
    </DragHandle>
  );
};
