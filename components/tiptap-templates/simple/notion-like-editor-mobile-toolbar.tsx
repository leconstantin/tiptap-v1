'use client';

import type { Editor } from '@tiptap/react';
import * as React from 'react';
import { ArrowLeftIcon } from '@/components/tiptap-icons/arrow-left-icon';
import { ChevronRightIcon } from '@/components/tiptap-icons/chevron-right-icon';
import { HighlighterIcon } from '@/components/tiptap-icons/highlighter-icon';
import { LinkIcon } from '@/components/tiptap-icons/link-icon';
import { MoreVerticalIcon } from '@/components/tiptap-icons/more-vertical-icon';
// --- Icons ---
import { PaintBucketIcon } from '@/components/tiptap-icons/paint-bucket-icon';
import { Repeat2Icon } from '@/components/tiptap-icons/repeat-2-icon';
import { AiAskButton } from '@/components/tiptap-ui/ai-ask-button';
import {
  ColorHighlightButton,
  HIGHLIGHT_COLORS,
} from '@/components/tiptap-ui/color-highlight-button';
// --- Tiptap UI ---
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  ColorHighlightPopoverContent,
} from '@/components/tiptap-ui/color-highlight-popover';
import {
  ColorTextButton,
  TEXT_COLORS,
} from '@/components/tiptap-ui/color-text-button';
import { useRecentColors } from '@/components/tiptap-ui/color-text-popover';
import { CopyAnchorLinkButton } from '@/components/tiptap-ui/copy-anchor-link-button';
import { CopyToClipboardButton } from '@/components/tiptap-ui/copy-to-clipboard-button';
import { DeleteNodeButton } from '@/components/tiptap-ui/delete-node-button';
import { useMenuActionVisibility } from '@/components/tiptap-ui/drag-context-menu';
import { DuplicateButton } from '@/components/tiptap-ui/duplicate-button';
import { ImageUploadButton } from '@/components/tiptap-ui/image-upload-button';
import {
  LinkButton,
  LinkContent,
  LinkPopover,
} from '@/components/tiptap-ui/link-popover';
import { MarkButton } from '@/components/tiptap-ui/mark-button';
import { MoveNodeButton } from '@/components/tiptap-ui/move-node-button';
import { ResetAllFormattingButton } from '@/components/tiptap-ui/reset-all-formatting-button';
import { SlashCommandTriggerButton } from '@/components/tiptap-ui/slash-command-trigger-button';
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button';
import { TurnIntoDropdownContent } from '@/components/tiptap-ui/turn-into-dropdown';
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
// --- UI Primitives ---
import {
  Card,
  CardBody,
  CardGroupLabel,
  CardItemGroup,
} from '@/components/tiptap-ui-primitive/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/tiptap-ui-primitive/dropdown-menu';
import { Separator } from '@/components/tiptap-ui-primitive/separator';
import { Spacer } from '@/components/tiptap-ui-primitive/spacer';
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from '@/components/tiptap-ui-primitive/toolbar';
import { useCursorVisibility } from '@/hooks/use-cursor-visibility';
// --- Hooks ---
import { useIsMobile } from '@/hooks/use-mobile';
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';
import { useWindowSize, type WindowSizeState } from '@/hooks/use-window-size';
// --- Utils ---
import { getNodeDisplayName } from '@/lib/tiptap-collab-utils';

// =============================================================================
// Types & Constants
// =============================================================================

const TOOLBAR_VIEWS = {
  MAIN: 'main',
  HIGHLIGHTER: 'highlighter',
  LINK: 'link',
} as const;

type ToolbarViewId = (typeof TOOLBAR_VIEWS)[keyof typeof TOOLBAR_VIEWS];

export type ToolbarViewType = {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  mobileButton?: (onClick: () => void) => React.ReactNode;
  desktopComponent?: React.ReactNode;
};

type ToolbarViewRegistry = Record<
  Exclude<ToolbarViewId, typeof TOOLBAR_VIEWS.MAIN>,
  ToolbarViewType
>;

interface ToolbarState {
  viewId: ToolbarViewId;
  setViewId: (id: ToolbarViewId) => void;
  isMainView: boolean;
  showMainView: () => void;
  showView: (id: ToolbarViewId) => void;
}

// =============================================================================
// Hooks
// =============================================================================

function useToolbarState(isMobile: boolean): ToolbarState {
  const [viewId, setViewId] = React.useState<ToolbarViewId>(TOOLBAR_VIEWS.MAIN);

  React.useEffect(() => {
    if (!isMobile && viewId !== TOOLBAR_VIEWS.MAIN) {
      setViewId(TOOLBAR_VIEWS.MAIN);
    }
  }, [isMobile, viewId]);

  return {
    viewId,
    setViewId,
    isMainView: viewId === TOOLBAR_VIEWS.MAIN,
    showMainView: () => setViewId(TOOLBAR_VIEWS.MAIN),
    showView: (id: ToolbarViewId) => setViewId(id),
  };
}

function hasTextSelection(editor: Editor | null): boolean {
  if (!(editor && editor.isEditable)) return false;

  const { selection } = editor.state;
  return !selection.empty;
}

export function useViewportTransform(
  vp: WindowSizeState,
  bodyRect: Omit<DOMRect, 'toJSON'>
) {
  const [transform, setTransform] = React.useState<string>('none');

  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    try {
      const transformOffsetTop = vp.height - bodyRect.height + vp.offsetTop;
      const transformScale = 1 / vp.scale;

      const newTransform = `translate(${vp.offsetLeft}px, ${transformOffsetTop}px) scale(${transformScale})`;
      setTransform(newTransform);
    } catch {
      setTransform('none');
    }
  }, [vp.height, vp.offsetTop, vp.offsetLeft, vp.scale, bodyRect.height]);

  return transform;
}

// =============================================================================
// Toolbar View Registry
// =============================================================================

function createToolbarViewRegistry(): ToolbarViewRegistry {
  return {
    [TOOLBAR_VIEWS.HIGHLIGHTER]: {
      id: TOOLBAR_VIEWS.HIGHLIGHTER,
      title: 'Text Highlighter',
      icon: <HighlighterIcon className="tiptap-button-icon" />,
      content: <ColorHighlightPopoverContent />,
      mobileButton: (onClick: () => void) => (
        <ColorHighlightPopoverButton onClick={onClick} />
      ),
      desktopComponent: <ColorHighlightPopover />,
    },
    [TOOLBAR_VIEWS.LINK]: {
      id: TOOLBAR_VIEWS.LINK,
      title: 'Link Editor',
      icon: <LinkIcon className="tiptap-button-icon" />,
      content: <LinkContent />,
      mobileButton: (onClick: () => void) => <LinkButton onClick={onClick} />,
      desktopComponent: <LinkPopover />,
    },
  };
}

// =============================================================================
// Sub-Components
// =============================================================================

function AlignmentGroup() {
  return (
    <ToolbarGroup>
      <TextAlignButton align="left" />
      <TextAlignButton align="center" />
      <TextAlignButton align="right" />
      <TextAlignButton align="justify" />
    </ToolbarGroup>
  );
}

function ScriptGroup() {
  return (
    <ToolbarGroup>
      <MarkButton type="superscript" />
      <MarkButton type="subscript" />
    </ToolbarGroup>
  );
}

function FormattingGroup() {
  return (
    <ToolbarGroup>
      <MarkButton type="bold" />
      <MarkButton type="italic" />
      <MarkButton type="strike" />
      <MarkButton type="code" />
    </ToolbarGroup>
  );
}

function ColorActionGroup() {
  const { recentColors, isInitialized, addRecentColor } = useRecentColors();

  const renderRecentColors = () => {
    if (!isInitialized || recentColors.length === 0) return null;

    return (
      <>
        <CardItemGroup>
          <CardGroupLabel>Recent colors</CardGroupLabel>
          <ButtonGroup>
            {recentColors.map((colorObj) => (
              <DropdownMenuItem
                asChild
                key={`${colorObj.type}-${colorObj.value}`}
              >
                {colorObj.type === 'text' ? (
                  <ColorTextButton
                    label={colorObj.label}
                    onApplied={({ color, label }) =>
                      addRecentColor({
                        type: 'text',
                        label,
                        value: color,
                      })
                    }
                    text={colorObj.label}
                    textColor={colorObj.value}
                    tooltip={colorObj.label}
                  />
                ) : (
                  <ColorHighlightButton
                    highlightColor={colorObj.value}
                    onApplied={({ color, label }) =>
                      addRecentColor({
                        type: 'highlight',
                        label,
                        value: color,
                      })
                    }
                    text={colorObj.label}
                    tooltip={colorObj.label}
                  />
                )}
              </DropdownMenuItem>
            ))}
          </ButtonGroup>
        </CardItemGroup>
        <Separator orientation="horizontal" />
      </>
    );
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger asChild>
        <Button data-style="ghost">
          <PaintBucketIcon className="tiptap-button-icon" />
          <span className="tiptap-button-text">Color</span>
          <Spacer />
          <ChevronRightIcon className="tiptap-button-icon" />
        </Button>
      </DropdownMenuSubTrigger>

      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <Card>
            <CardBody>
              {renderRecentColors()}

              <CardItemGroup>
                <CardGroupLabel>Text color</CardGroupLabel>
                <ButtonGroup>
                  {TEXT_COLORS.map((textColor) => (
                    <DropdownMenuItem asChild key={textColor.value}>
                      <ColorTextButton
                        label={textColor.label}
                        onApplied={({ color, label }) =>
                          addRecentColor({ type: 'text', label, value: color })
                        }
                        text={textColor.label}
                        textColor={textColor.value}
                        tooltip={textColor.label}
                      />
                    </DropdownMenuItem>
                  ))}
                </ButtonGroup>
              </CardItemGroup>

              <Separator orientation="horizontal" />

              <CardItemGroup>
                <CardGroupLabel>Highlight color</CardGroupLabel>
                <ButtonGroup>
                  {HIGHLIGHT_COLORS.map((highlightColor) => (
                    <DropdownMenuItem asChild key={highlightColor.value}>
                      <ColorHighlightButton
                        highlightColor={highlightColor.value}
                        onApplied={({ color, label }) =>
                          addRecentColor({
                            type: 'highlight',
                            label,
                            value: color,
                          })
                        }
                        text={highlightColor.label}
                        tooltip={highlightColor.label}
                      />
                    </DropdownMenuItem>
                  ))}
                </ButtonGroup>
              </CardItemGroup>
            </CardBody>
          </Card>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

function TransformActionGroup() {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger asChild>
        <Button data-style="ghost">
          <Repeat2Icon className="tiptap-button-icon" />
          <span className="tiptap-button-text">Turn into</span>
          <Spacer />
          <ChevronRightIcon className="tiptap-button-icon" />
        </Button>
      </DropdownMenuSubTrigger>

      <DropdownMenuSubContent>
        <TurnIntoDropdownContent />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

// =============================================================================
// Dropdown Menu Components
// =============================================================================

interface DropdownMenuActionsProps {
  editor: Editor | null;
}

function DropdownMenuActions({ editor }: DropdownMenuActionsProps) {
  const {
    hasAnyActionGroups,
    hasColorActions,
    hasTransformActions,
    hasResetFormatting,
  } = useMenuActionVisibility(editor);
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardBody>
        <CardItemGroup>
          <CardGroupLabel>{getNodeDisplayName(editor)}</CardGroupLabel>
          <ButtonGroup>
            {hasColorActions && <ColorActionGroup />}
            {hasTransformActions && <TransformActionGroup />}
            {hasResetFormatting && (
              <DropdownMenuItem asChild>
                <ResetAllFormattingButton text="Reset formatting" />
              </DropdownMenuItem>
            )}
          </ButtonGroup>
        </CardItemGroup>

        {hasAnyActionGroups && <Separator orientation="horizontal" />}

        <ButtonGroup>
          <DropdownMenuItem asChild>
            <DuplicateButton showShortcut={!isMobile} text="Duplicate node" />
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <CopyToClipboardButton
              showShortcut={!isMobile}
              text="Copy to clipboard"
            />
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <CopyAnchorLinkButton
              showShortcut={!isMobile}
              text="Copy anchor link"
            />
          </DropdownMenuItem>
        </ButtonGroup>

        <Separator orientation="horizontal" />

        <ButtonGroup>
          <DropdownMenuItem asChild>
            <AiAskButton showShortcut={!isMobile} text="Ask AI" />
          </DropdownMenuItem>
        </ButtonGroup>

        <Separator orientation="horizontal" />

        <ButtonGroup>
          <DropdownMenuItem asChild>
            <DeleteNodeButton showShortcut={!isMobile} text="Delete" />
          </DropdownMenuItem>
        </ButtonGroup>
      </CardBody>
    </Card>
  );
}

function MoreActionsDropdown({ editor }: DropdownMenuActionsProps) {
  return (
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger asChild>
        <Button data-appearance="subdued" data-style="ghost">
          <MoreVerticalIcon className="tiptap-button-icon" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent portal={true}>
        <DropdownMenuActions editor={editor} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// =============================================================================
// Toolbar View Components
// =============================================================================

interface ToolbarViewButtonProps {
  view: ToolbarViewType;
  isMobile: boolean;
  onViewChange: (viewId: ToolbarViewId) => void;
}

function ToolbarViewButton({
  view,
  isMobile,
  onViewChange,
}: ToolbarViewButtonProps) {
  const viewId = view.id as Exclude<ToolbarViewId, typeof TOOLBAR_VIEWS.MAIN>;

  if (isMobile) {
    return view.mobileButton ? (
      React.cloneElement(
        view.mobileButton(() => onViewChange(viewId)) as React.ReactElement,
        { key: view.id }
      )
    ) : (
      <Button key={view.id} onClick={() => onViewChange(viewId)}>
        {view.icon}
      </Button>
    );
  }

  return view.desktopComponent
    ? React.cloneElement(view.desktopComponent as React.ReactElement, {
        key: view.id,
      })
    : null;
}

interface ToolbarViewsGroupProps {
  toolbarViews: ToolbarViewRegistry;
  isMobile: boolean;
  onViewChange: (viewId: ToolbarViewId) => void;
}

function ToolbarViewsGroup({
  toolbarViews,
  isMobile,
  onViewChange,
}: ToolbarViewsGroupProps) {
  return (
    <>
      {Object.values(toolbarViews).map((view) => (
        <ToolbarViewButton
          isMobile={isMobile}
          key={view.id}
          onViewChange={onViewChange}
          view={view}
        />
      ))}
    </>
  );
}

// =============================================================================
// Main Toolbar Content
// =============================================================================

interface MainToolbarContentProps {
  editor: Editor | null;
  isMobile: boolean;
  toolbarViews: ToolbarViewRegistry;
  onViewChange: (viewId: ToolbarViewId) => void;
}

function MainToolbarContent({
  editor,
  isMobile,
  toolbarViews,
  onViewChange,
}: MainToolbarContentProps) {
  const hasSelection = hasTextSelection(editor);

  return (
    <>
      <ToolbarGroup>
        <SlashCommandTriggerButton />
        <MoreActionsDropdown editor={editor} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MoveNodeButton direction="down" />
        <MoveNodeButton direction="up" />
      </ToolbarGroup>

      {hasSelection && (
        <>
          <ToolbarSeparator />

          <FormattingGroup />

          <ToolbarSeparator />

          <ToolbarViewsGroup
            isMobile={isMobile}
            onViewChange={onViewChange}
            toolbarViews={toolbarViews}
          />

          <ToolbarSeparator />

          <ScriptGroup />

          <ToolbarSeparator />

          <AlignmentGroup />

          <ToolbarSeparator />

          <ToolbarGroup>
            <ImageUploadButton text="Add" />
          </ToolbarGroup>
        </>
      )}
    </>
  );
}

// =============================================================================
// Specialized Toolbar Content
// =============================================================================

interface SpecializedToolbarContentProps {
  view: ToolbarViewType;
  onBack: () => void;
}

function SpecializedToolbarContent({
  view,
  onBack,
}: SpecializedToolbarContentProps) {
  return (
    <>
      <ToolbarGroup>
        <Button data-style="ghost" onClick={onBack}>
          <ArrowLeftIcon className="tiptap-button-icon" />
          {view.icon}
        </Button>
      </ToolbarGroup>

      <ToolbarSeparator />

      {view.content}
    </>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export interface MobileToolbarProps {
  editor?: Editor | null;
}

export function MobileToolbar({ editor: providedEditor }: MobileToolbarProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const isMobile = useIsMobile(480);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const toolbarState = useToolbarState(isMobile);
  const toolbarViews = React.useMemo(() => createToolbarViewRegistry(), []);

  const currentView = toolbarState.isMainView
    ? null
    : toolbarViews[
        toolbarState.viewId as Exclude<ToolbarViewId, typeof TOOLBAR_VIEWS.MAIN>
      ];

  const { height } = useWindowSize();
  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  if (!(isMobile && editor && editor.isEditable)) {
    return null;
  }

  return (
    <Toolbar
      ref={toolbarRef}
      style={{
        ...(isMobile
          ? {
              bottom: `calc(100% - ${height - rect.y}px)`,
            }
          : {}),
      }}
    >
      {toolbarState.isMainView ? (
        <MainToolbarContent
          editor={editor}
          isMobile={isMobile}
          onViewChange={toolbarState.showView}
          toolbarViews={toolbarViews}
        />
      ) : (
        currentView && (
          <SpecializedToolbarContent
            onBack={toolbarState.showMainView}
            view={currentView}
          />
        )
      )}
    </Toolbar>
  );
}
