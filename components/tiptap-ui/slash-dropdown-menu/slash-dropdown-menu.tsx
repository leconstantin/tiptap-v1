'use client';

// --- Hooks ---
import type { SlashMenuConfig } from '@/components/tiptap-ui/slash-dropdown-menu/use-slash-dropdown-menu';
import { useSlashDropdownMenu } from '@/components/tiptap-ui/slash-dropdown-menu/use-slash-dropdown-menu';
// --- UI Primitives ---
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import {
  Card,
  CardBody,
  CardGroupLabel,
  CardItemGroup,
} from '@/components/tiptap-ui-primitive/card';
import { Separator } from '@/components/tiptap-ui-primitive/separator';
// --- Tiptap UI ---
import type {
  SuggestionItem,
  SuggestionMenuProps,
  SuggestionMenuRenderProps,
} from '@/components/tiptap-ui-utils/suggestion-menu';
import {
  filterSuggestionItems,
  SuggestionMenu,
} from '@/components/tiptap-ui-utils/suggestion-menu';
// --- Lib ---
import { getElementOverflowPosition } from '@/lib/tiptap-collab-utils';

import '@/components/tiptap-ui/slash-dropdown-menu/slash-dropdown-menu.scss';
import React from 'react';

type SlashDropdownMenuProps = Omit<
  SuggestionMenuProps,
  'items' | 'children'
> & {
  config?: SlashMenuConfig;
};

export const SlashDropdownMenu = (props: SlashDropdownMenuProps) => {
  const { config, ...restProps } = props;
  const { getSlashMenuItems } = useSlashDropdownMenu(config);

  return (
    <SuggestionMenu
      char="/"
      decorationClass="tiptap-slash-decoration"
      decorationContent="Filter..."
      items={({ query, editor }) =>
        filterSuggestionItems(getSlashMenuItems(editor), query)
      }
      pluginKey="slashDropdownMenu"
      selector="tiptap-slash-dropdown-menu"
      {...restProps}
    >
      {(props) => <List {...props} config={config} />}
    </SuggestionMenu>
  );
};

const Item = (props: {
  item: SuggestionItem;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const { item, isSelected, onSelect } = props;
  const itemRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const selector = document.querySelector(
      '[data-selector="tiptap-slash-dropdown-menu"]'
    ) as HTMLElement;
    if (!(itemRef.current && isSelected && selector)) return;

    const overflow = getElementOverflowPosition(itemRef.current, selector);

    if (overflow === 'top') {
      itemRef.current.scrollIntoView(true);
    } else if (overflow === 'bottom') {
      itemRef.current.scrollIntoView(false);
    }
  }, [isSelected]);

  const BadgeIcon = item.badge;

  return (
    <Button
      data-active-state={isSelected ? 'on' : 'off'}
      data-style="ghost"
      onClick={onSelect}
      ref={itemRef}
    >
      {BadgeIcon && <BadgeIcon className="tiptap-button-icon" />}
      <div className="tiptap-button-text">{item.title}</div>
    </Button>
  );
};

const List = ({
  items,
  selectedIndex,
  onSelect,
  config,
}: SuggestionMenuRenderProps & { config?: SlashMenuConfig }) => {
  const renderedItems = React.useMemo(() => {
    const rendered: React.ReactElement[] = [];
    const showGroups = config?.showGroups !== false;

    if (!showGroups) {
      items.forEach((item, index) => {
        rendered.push(
          <Item
            isSelected={index === selectedIndex}
            item={item}
            key={`item-${index}-${item.title}`}
            onSelect={() => onSelect(item)}
          />
        );
      });
      return rendered;
    }

    const groups: {
      [groupLabel: string]: { items: SuggestionItem[]; indices: number[] };
    } = {};

    items.forEach((item, index) => {
      const groupLabel = item.group || '';
      if (!groups[groupLabel]) {
        groups[groupLabel] = { items: [], indices: [] };
      }
      groups[groupLabel].items.push(item);
      groups[groupLabel].indices.push(index);
    });

    Object.entries(groups).forEach(([groupLabel, groupData], groupIndex) => {
      if (groupIndex > 0) {
        rendered.push(
          <Separator key={`separator-${groupIndex}`} orientation="horizontal" />
        );
      }

      const groupItems = groupData.items.map((item, itemIndex) => {
        const originalIndex = groupData.indices[itemIndex];
        return (
          <Item
            isSelected={originalIndex === selectedIndex}
            item={item}
            key={`item-${originalIndex}-${item.title}`}
            onSelect={() => onSelect(item)}
          />
        );
      });

      if (groupLabel) {
        rendered.push(
          <CardItemGroup key={`group-${groupIndex}-${groupLabel}`}>
            <CardGroupLabel>{groupLabel}</CardGroupLabel>
            <ButtonGroup>{groupItems}</ButtonGroup>
          </CardItemGroup>
        );
      } else {
        rendered.push(...groupItems);
      }
    });

    return rendered;
  }, [items, selectedIndex, onSelect, config?.showGroups]);

  if (!renderedItems.length) {
    return null;
  }

  return (
    <Card
      className="tiptap-slash-card"
      style={{
        maxHeight: 'var(--suggestion-menu-max-height)',
      }}
    >
      <CardBody className="tiptap-slash-card-body">{renderedItems}</CardBody>
    </Card>
  );
};
