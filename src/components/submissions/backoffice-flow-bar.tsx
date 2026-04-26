import Link from 'next/link'

type BackofficeFlowStep = {
  id: 'admin' | 'submit' | 'queue' | 'review' | 'edit'
  indexLabel: string
  label: string
  description: string
  href?: string
}

const backofficeFlowSteps: BackofficeFlowStep[] = [
  {
    id: 'admin',
    indexLabel: '00',
    label: '总控台',
    description: '进入主工作流入口',
    href: '/admin',
  },
  {
    id: 'submit',
    indexLabel: '01',
    label: '内部录入',
    description: '先录最小必填字段',
    href: '/submit-stock',
  },
  {
    id: 'queue',
    indexLabel: '02',
    label: '审核队列',
    description: '按列表推进待处理项',
    href: '/admin/submissions',
  },
  {
    id: 'review',
    indexLabel: '03',
    label: '提报审核',
    description: '补齐并转成草稿',
  },
  {
    id: 'edit',
    indexLabel: '04',
    label: '发布前确认',
    description: '确认最终发布值',
  },
]

type BackofficeFlowStepId = BackofficeFlowStep['id']

function getStepState(currentStep: BackofficeFlowStepId, stepId: BackofficeFlowStepId) {
  const currentStepIndex = backofficeFlowSteps.findIndex((step) => step.id === currentStep)
  const targetStepIndex = backofficeFlowSteps.findIndex((step) => step.id === stepId)

  if (targetStepIndex === currentStepIndex) {
    return 'current'
  }

  if (targetStepIndex < currentStepIndex) {
    return 'completed'
  }

  return 'upcoming'
}

function getStepClassName(stepState: 'current' | 'completed' | 'upcoming') {
  if (stepState === 'current') {
    return 'border-teal-DEFAULT/40 bg-teal-DEFAULT/10'
  }

  if (stepState === 'completed') {
    return 'border-border/70 bg-background/70'
  }

  return 'border-border/50 bg-background/30'
}

function getBadgeClassName(stepState: 'current' | 'completed' | 'upcoming') {
  if (stepState === 'current') {
    return 'border-teal-DEFAULT/40 bg-teal-DEFAULT/10 text-teal-DEFAULT'
  }

  if (stepState === 'completed') {
    return 'border-border bg-background text-foreground'
  }

  return 'border-border/70 bg-background text-muted'
}

export function BackofficeFlowBar({
  currentStep,
}: {
  currentStep: BackofficeFlowStepId
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-DEFAULT">
        当前流程
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-5">
        {backofficeFlowSteps.map((step) => {
          const stepState = getStepState(currentStep, step.id)
          const content = (
            <div className={`rounded-2xl border p-3 transition-colors ${getStepClassName(stepState)}`}>
              <div className="flex items-start justify-between gap-3">
                <div className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] ${getBadgeClassName(stepState)}`}>
                  {step.indexLabel}
                </div>
                <div className="text-[11px] text-muted">
                  {stepState === 'current' ? '当前' : stepState === 'completed' ? '已过' : '后续'}
                </div>
              </div>
              <div className="mt-3 text-sm font-medium text-foreground">{step.label}</div>
              <div className="mt-1 text-xs text-muted">{step.description}</div>
            </div>
          )

          if (step.href && stepState !== 'current') {
            return (
              <Link key={step.id} href={step.href} className="block hover:opacity-90">
                {content}
              </Link>
            )
          }

          return (
            <div key={step.id}>
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
