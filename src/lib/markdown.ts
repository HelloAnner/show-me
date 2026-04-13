import { marked } from 'marked'
import { createHighlighter, type Highlighter } from 'shiki'

let highlighter: Highlighter | null = null

async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-light'],
      langs: ['typescript', 'javascript', 'python', 'go', 'bash', 'yaml', 'json', 'sql', 'css', 'html', 'markdown', 'rust'],
    })
  }
  return highlighter
}

export async function renderMarkdown(content: string): Promise<string> {
  const hl = await getHighlighter()

  const renderer = new marked.Renderer()

  renderer.code = ({ text, lang }) => {
    const language = lang || 'text'
    try {
      return hl.codeToHtml(text, { lang: language, theme: 'github-light' })
    } catch {
      return `<pre class="shiki"><code>${escapeHtml(text)}</code></pre>`
    }
  }

  renderer.image = ({ href, title, text }) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
    return `<figure>
      <img src="${escapeHtml(href)}" alt="${escapeHtml(text)}" loading="lazy"${titleAttr} />
      ${text ? `<figcaption>${escapeHtml(text)}</figcaption>` : ''}
    </figure>`
  }

  return marked.parse(content, { renderer }) as string
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
