import type { Editor } from '@tiptap/react';
import { Badge } from '@/components/tiptap-ui-primitive/badge';
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button';
import { useTiptapEditor } from '@/hooks/use-tiptap-editor';

export interface CharCountButtonProps extends Omit<ButtonProps, 'type'> {
  editor?: Editor | null;
}

export function CharCountButton({
  editor: providedEditor,
}: CharCountButtonProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const characters = editor?.storage.characterCount.characters() ?? 0;
  const words = editor?.storage.characterCount.words() ?? 0;

  return (
    <div className="flex gap-2">
      <Badge className="overflow-hidden truncate text-ellipsis whitespace-nowrap px-3 py-2">
        {characters} characters
      </Badge>
      <Badge className="overflow-hidden truncate text-ellipsis whitespace-nowrap px-3 py-2">
        {words} words
      </Badge>
    </div>
  );
}
