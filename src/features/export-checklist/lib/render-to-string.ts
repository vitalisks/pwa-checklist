import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import type { ReactElement } from 'react'

export function reactElementToHtml(element: ReactElement): string {
  const div = document.createElement('div')
  const root = createRoot(div)
  flushSync(() => root.render(element))
  const html = div.innerHTML
  root.unmount()
  return html
}
