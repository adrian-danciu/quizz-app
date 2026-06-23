import { lazy } from 'react'

export const LazyAuthProvider = lazy(() =>
  import('./AuthProvider').then(({ AuthProvider: component }) => ({
    default: component,
  })),
)
