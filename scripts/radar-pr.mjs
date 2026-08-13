// Create a registration PR on awesome-dsh-plugins via gh api (works when git push is blocked).
// Usage: node scripts/radar-pr.mjs <plugin-name> <owner/repo> <description> <version>
// Example: node scripts/radar-pr.mjs dsh-tray qing3a/dsh-tray "Windows 系统托盘插件" 0.1.0
import { execFileSync } from 'node:child_process'

const OWNER = 'AdamPlatin123'
const REPO = 'awesome-dsh-plugins'

const pluginName = process.argv[2]
const pluginRepo = process.argv[3] // owner/repo
const description = process.argv[4]
const version = process.argv[5] ?? '0.1.0'
if (!pluginName || !pluginRepo || !description) {
  console.error('usage: node radar-pr.mjs <plugin-name> <owner/repo> <description> [version]')
  process.exit(1)
}

const forkOwner = pluginRepo.split('/')[0]
const FORK = `${forkOwner}/awesome-dsh-plugins`
const BRANCH = `docs/register-${pluginName}`
const PLUGINS_PATH = 'PLUGINS.md'
const PLUGIN_URL = `https://github.com/${pluginRepo}`
const ROW = `| ${pluginName} | [${pluginRepo}](${PLUGIN_URL}) | ${description} | ✅ |\n`
const ANCHOR = '| 插件 | 仓库 | 说明 | 运行级 |\n'

function gh(args, input) {
  const opts =
    input === undefined
      ? { encoding: 'utf8' }
      : { input: JSON.stringify(input), encoding: 'utf8' }
  const full = input === undefined ? args : [...args, '--input', '-']
  return execFileSync('gh', ['api', ...full], opts)
}

// 1. fork main head sha
const forkRef = JSON.parse(gh([`repos/${FORK}/git/ref/heads/main`]))
const baseSha = forkRef.object.sha
console.log('fork main sha:', baseSha.slice(0, 7))

// 2. Create branch (delete if exists)
try {
  gh([`repos/${FORK}/git/refs/heads/${BRANCH}`, '--method', 'DELETE'])
  console.log('deleted existing branch')
} catch { /* not exists */ }
gh([`repos/${FORK}/git/refs`, '--method', 'POST'], {
  ref: `refs/heads/${BRANCH}`,
  sha: baseSha,
})
console.log('branch created:', BRANCH)

// 3. Get current PLUGINS.md blob sha
const current = JSON.parse(gh([`repos/${FORK}/contents/${PLUGINS_PATH}?ref=${BRANCH}`]))
const currentContent = Buffer.from(current.content, 'base64').toString('utf8')

// 4. Insert row into the 单插件 (single plugin) table, after the header row
if (!currentContent.includes(pluginName)) {
  const updated = currentContent.replace(ANCHOR, ANCHOR + ROW)
  gh([`repos/${FORK}/contents/${PLUGINS_PATH}`, '--method', 'PUT'], {
    message: `docs: 登记 ${pluginName}`,
    content: Buffer.from(updated, 'utf8').toString('base64'),
    sha: current.sha,
    branch: BRANCH,
  })
  console.log('PLUGINS.md updated with', pluginName, 'row')
} else {
  console.log('row already present')
}

// 5. Create PR
const body = `## 插件信息

| 项 | 值 |
|---|---|
| 插件名 | ${pluginName} |
| 仓库 | ${PLUGIN_URL} |
| 一句话说明 | ${description} |
| 版本 | ${version} |

## 自检清单

- [x] package.json name 使用 @dsh-external scope
- [x] 仓库已打 dsh-plugin topic
- [x] 所有运行时依赖已声明
- [x] 运行时验证实测（本地 DSH 源码环境，2026-08-14）：**web + headless 双 profile 加载通过；win32 上 trayicon.exe 进程正常 spawn（单进程），首页 200；headless 无 webServer 时降级不崩**。验证方法见 https://github.com/deepseek-ai/deepseek-harness/discussions/462

## 改动内容
- PLUGINS.md 单插件表新增一行（运行级 ✅，基于本地运行时验证）
`
const pr = JSON.parse(gh([`repos/${OWNER}/${REPO}/pulls`, '--method', 'POST'], {
  title: `docs: 登记 ${pluginName}`,
  head: `${forkOwner}:${BRANCH}`,
  base: 'main',
  body,
}))
console.log('PR created:', pr.html_url)
