export {}

declare global {
  interface Window {
    electronAPI?: {
      saveJson: (payload: { data: unknown; defaultPath?: string }) => Promise<{ canceled: boolean; filePath?: string }>
      openJson: () => Promise<{ canceled: boolean; filePath?: string; data?: unknown; error?: string }>
    }
  }
}

