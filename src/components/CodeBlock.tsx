import { Box, Typography } from '@mui/material'
import { Highlight, themes } from 'prism-react-renderer'
import Prism from 'prismjs'
import 'prismjs/components/prism-bash.js'
import 'prismjs/components/prism-c.js'
import 'prismjs/components/prism-cpp.js'
import 'prismjs/components/prism-java.js'
import 'prismjs/components/prism-python.js'
import 'prismjs/components/prism-sql.js'

const languageMap: Record<string, string> = {
  c: 'c',
  cpp: 'cpp',
  python: 'python',
  java: 'java',
  sql: 'sql',
  bash: 'bash',
}

const languageLabels: Record<string, string> = {
  c: 'C',
  cpp: 'C++',
  python: 'Python',
  java: 'Java',
  sql: 'SQL',
  bash: 'Bash',
  text: 'Text',
}

type CodeBlockProps = {
  code: string
  language?: string
}

const codeSurfaceSx = {
  m: 0,
  minWidth: 0,
  maxWidth: '100%',
  px: { xs: 'var(--quiz-code-padding-x, 12px)', md: 2 },
  pt: { xs: 'var(--quiz-code-padding-top, 30px)', md: 3.75 },
  pb: { xs: 'var(--quiz-code-padding-bottom, 12px)', md: 1.5 },
  overflow: 'hidden',
  borderRadius: 1.5,
  bgcolor: '#f6f8fa',
  border: '1px solid #d8dee4',
  color: '#24292f',
  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontWeight: 500,
  fontSize: { xs: 'var(--quiz-code-font-size, 0.78rem)', md: '0.78rem' },
  lineHeight: { xs: 'var(--quiz-code-line-height, 1.6)', md: 1.6 },
  tabSize: 2,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
} as const

function CodeShell({
  language,
  children,
}: {
  language: string
  children: React.ReactNode
}) {
  return (
    <Box sx={{ position: 'relative', minWidth: 0 }}>
      <Typography
        component="span"
        sx={{
          position: 'absolute',
          zIndex: 1,
          top: 7,
          right: 10,
          color: '#57606a',
          font: '700 0.6rem/1.2 ui-sans-serif, system-ui, sans-serif',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}
      >
        {languageLabels[language] ?? language}
      </Typography>
      {children}
    </Box>
  )
}

export function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  const normalizedLanguage = language.toLowerCase()
  const prismLanguage = languageMap[normalizedLanguage]

  if (!prismLanguage) {
    return (
      <CodeShell language={normalizedLanguage}>
        <Box component="pre" data-language={normalizedLanguage} sx={codeSurfaceSx}>
          <code>{code}</code>
        </Box>
      </CodeShell>
    )
  }

  return (
    <CodeShell language={normalizedLanguage}>
      <Highlight
        prism={Prism}
        theme={themes.github}
        code={code}
        language={prismLanguage}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <Box
            component="pre"
            data-language={normalizedLanguage}
            className={className}
            style={{ ...style, backgroundColor: 'transparent' }}
            sx={codeSurfaceSx}
          >
            <code>
              {tokens.map((line, lineIndex) => (
                <span key={lineIndex} {...getLineProps({ line })}>
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                  {lineIndex < tokens.length - 1 ? '\n' : null}
                </span>
              ))}
            </code>
          </Box>
        )}
      </Highlight>
    </CodeShell>
  )
}
