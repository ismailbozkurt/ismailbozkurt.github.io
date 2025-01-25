/// <reference types="vite/client" />

declare module 'react-markdown' {
  import React from 'react'
  const ReactMarkdown: React.FC<{ children: string }>
  export default ReactMarkdown
}
