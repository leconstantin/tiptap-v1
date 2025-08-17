"use client"

import type { Editor } from "@tiptap/react"
import { useEditorState } from "@tiptap/react"

export type UiEditorState = {
  aiGenerationIsSelection: boolean
  aiGenerationIsLoading: boolean
  aiGenerationActive: boolean
  aiGenerationHasMessage: boolean
  commentInputVisible: boolean
  lockDragHandle: boolean
}

const defaultUiEditorState: UiEditorState = {
  aiGenerationIsSelection: false,
  aiGenerationIsLoading: false,
  aiGenerationActive: false,
  aiGenerationHasMessage: false,
  commentInputVisible: false,
  lockDragHandle: false,
}

export function useUiEditorState(editor: Editor | null): UiEditorState {
  const aiState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return defaultUiEditorState

      if (!editor.storage.uiState) {
        console.warn(
          "Editor storage uiState is not initialized. Ensure you have the uiState extension added to your editor."
        )

        return defaultUiEditorState
      }

      const aiGenerationIsSelection =
        editor.storage.uiState.aiGenerationIsSelection ?? false
      const aiGenerationIsLoading =
        editor.storage.uiState.aiGenerationIsLoading ?? false
      const aiGenerationActive =
        editor.storage.uiState.aiGenerationActive ?? false
      const aiGenerationHasMessage =
        editor.storage.uiState.aiGenerationHasMessage ?? false
      const commentInputVisible =
        editor.storage.uiState.commentInputVisible ?? false
      const lockDragHandle = editor.storage.uiState.lockDragHandle ?? false

      return {
        aiGenerationIsSelection,
        aiGenerationIsLoading,
        aiGenerationActive,
        aiGenerationHasMessage,
        commentInputVisible,
        lockDragHandle,
      }
    },
  })

  return aiState ?? defaultUiEditorState
}

export default useUiEditorState
