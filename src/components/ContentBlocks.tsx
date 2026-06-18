import { Box, Stack, Typography } from '@mui/material'
import type { ContentBlock } from '../features/quiz'

export function ContentBlocks({ blocks }: { blocks: readonly ContentBlock[] }) {
  return (
    <Stack spacing={1.5}>
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <Box
              key={index}
              component="pre"
              sx={{
                m: 0,
                p: '7px 10px',
                overflowX: 'auto',
                borderRadius: 1.5,
                bgcolor: '#eef3f9',
                border: '1px solid #d9e3ef',
                color: '#17233a',
                font: '500 0.7rem/1.45 "SFMono-Regular", Consolas, monospace',
                whiteSpace: 'pre-wrap',
              }}
            >
              <code>{block.value}</code>
            </Box>
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
