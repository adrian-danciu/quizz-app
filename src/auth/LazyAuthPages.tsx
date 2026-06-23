import { lazy } from 'react'

export const LazyLoginPage = lazy(() =>
  import('../pages/LoginPage').then(({ LoginPage: component }) => ({
    default: component,
  })),
)

export const LazyAuthCallbackPage = lazy(() =>
  import('../pages/AuthCallbackPage').then(
    ({ AuthCallbackPage: component }) => ({ default: component }),
  ),
)
