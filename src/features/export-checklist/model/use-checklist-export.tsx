import { useState, useCallback, useRef, useMemo } from 'react'
import type { Checklist } from '@/shared/config'
import { useTranslation } from '@/shared/i18n'
import { ChecklistReport } from '../ui/ChecklistReport'
import type { ChecklistReportLabels } from '../ui/ChecklistReport'
import { reactElementToHtml } from '../lib/render-to-string'
import {
  renderChecklistToImage,
  downloadBlob,
  shareBlob,
  sanitizeFilename,
} from '../api/export-image'

type ExportAction = 'download' | 'share'

interface ExportState {
  action: ExportAction | null
  status: 'idle' | 'generating' | 'success' | 'error'
  errorMessage?: string
}

export function useChecklistExport() {
  const { t, language } = useTranslation()
  const [state, setState] = useState<ExportState>({ action: null, status: 'idle' })
  const containerRef = useRef<HTMLDivElement>(null)

  const labels: ChecklistReportLabels = useMemo(() => ({
    active: t.filter.unfinished,
    completed: t.filter.done,
    progress: t.export.progress,
    fromTemplate: t.export.fromTemplate,
    generatedBy: t.export.generatedBy,
    noItems: t.checklist.noItems,
    noCategories: t.export.noCategories,
  }), [t])

  const reset = useCallback(() => {
    setState({ action: null, status: 'idle' })
  }, [])

  const renderReport = useCallback((checklist: Checklist, comment?: string): string => {
    return reactElementToHtml(
      <ChecklistReport checklist={checklist} language={language} labels={labels} comment={comment} />
    )
  }, [language, labels])

  const exportAsImage = useCallback(async (checklist: Checklist, comment?: string) => {
    setState({ action: 'download', status: 'generating' })
    try {
      if (!containerRef.current) throw new Error('No container ref')
      containerRef.current.innerHTML = renderReport(checklist, comment)
      const blob = await renderChecklistToImage(containerRef.current, 'jpeg')
      const filename = `${sanitizeFilename(checklist.title)}.jpg`
      await downloadBlob(blob, filename)
      setState({ action: 'download', status: 'success' })
    } catch {
      setState({ action: 'download', status: 'error', errorMessage: t.export.error })
    }
  }, [renderReport, t.export.error])

  const exportAndShareImage = useCallback(async (checklist: Checklist, comment?: string) => {
    setState({ action: 'share', status: 'generating' })
    try {
      if (!containerRef.current) throw new Error('No container ref')
      containerRef.current.innerHTML = renderReport(checklist, comment)
      const blob = await renderChecklistToImage(containerRef.current, 'jpeg')
      const shared = await shareBlob(blob, checklist.title, 'jpeg')
      if (shared) {
        setState({ action: 'share', status: 'success' })
      } else {
        setState({ action: 'share', status: 'error', errorMessage: t.export.error })
      }
    } catch {
      setState({ action: 'share', status: 'error', errorMessage: t.export.error })
    }
  }, [renderReport, t.export.error])

  return {
    state,
    containerRef,
    exportAsImage,
    exportAndShareImage,
    reset,
  }
}
