import { lazy, Suspense } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import type { ContentBlock } from '../features/quiz'

const CodeBlock = lazy(() =>
  import('./CodeBlock').then(({ CodeBlock: component }) => ({
    default: component,
  })),
)

function CodeFallback({ code, language }: { code: string; language?: string }) {
  return (
    <Box
      component="pre"
      data-language={language ?? 'text'}
      sx={{
        m: 0,
        maxWidth: '100%',
        minWidth: 0,
        px: { xs: 'var(--quiz-code-padding-x, 12px)', md: 2 },
        pt: { xs: 'var(--quiz-code-padding-top, 30px)', md: 3.75 },
        pb: { xs: 'var(--quiz-code-padding-bottom, 12px)', md: 1.5 },
        overflow: 'hidden',
        borderRadius: 1.5,
        bgcolor: '#f6f8fa',
        border: '1px solid #d8dee4',
        fontFamily: '"SFMono-Regular", Consolas, monospace',
        fontWeight: 500,
        fontSize: { xs: 'var(--quiz-code-font-size, 0.78rem)', md: '0.78rem' },
        lineHeight: { xs: 'var(--quiz-code-line-height, 1.6)', md: 1.6 },
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      }}
    >
      <code>{code}</code>
    </Box>
  )
}

export function ContentBlocks({ blocks }: { blocks: readonly ContentBlock[] }) {
  return (
    <Stack sx={{ minWidth: 0, maxWidth: '100%', gap: 'var(--quiz-block-gap, 12px)' }}>
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <Suspense
              key={index}
              fallback={
                <CodeFallback code={block.value} language={block.language} />
              }
            >
              <CodeBlock code={block.value} language={block.language} />
            </Suspense>
          )
        }

        if (block.type === 'image') {
          return (
            <Box
              key={index}
              component="img"
              src={block.src}
              alt={block.alt ?? ''}
              sx={{ display: 'block', maxWidth: '100%', maxHeight: 420, objectFit: 'contain', mx: 'auto' }}
            />
          )
        }

        return (
          <Typography key={index} sx={{ whiteSpace: 'pre-wrap', fontSize: 'inherit', lineHeight: 1.7 }}>
            {block.value}
          </Typography>
        )
      })}
    </Stack>
  )
}
