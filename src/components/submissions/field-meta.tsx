import type { ReactNode } from 'react'

type SubmissionFieldLabelProps = {
  htmlFor?: string
  label: string
  required?: boolean
}

type SubmissionFieldHintProps = {
  children: string
}

type SubmissionGuidePanelProps = {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function SubmissionFieldLabel({
  htmlFor,
  label,
  required = false,
}: SubmissionFieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-2 text-sm font-medium text-foreground"
    >
      <span>{label}</span>
      {required ? <span className="text-status-danger">*</span> : null}
    </label>
  )
}

export function SubmissionFieldHint({ children }: SubmissionFieldHintProps) {
  return <p className="text-xs leading-5 text-muted">{children}</p>
}

export function SubmissionGuidePanel({
  title,
  children,
  defaultOpen = false,
}: SubmissionGuidePanelProps) {
  return (
    <details
      open={defaultOpen}
      className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-muted"
    >
      <summary className="cursor-pointer list-none font-medium text-foreground">
        {title}
      </summary>
      <div className="mt-3 space-y-2 text-xs leading-6 text-muted">{children}</div>
    </details>
  )
}
