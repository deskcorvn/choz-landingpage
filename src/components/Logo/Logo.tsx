import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      {/* eslint-disable @next/next/no-img-element */}
      <img
        alt="Chợ Z Logo"
        width={34}
        height={34}
        loading={loading}
        fetchPriority={priority}
        decoding="async"
        className="h-[34px] w-[34px] shrink-0"
        src="/images/miniapp/logo.svg"
      />
      <span className="font-bold text-lg tracking-tight select-none">Chợ Z</span>
    </div>
  )
}
