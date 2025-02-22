import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Hello from './Hello'
import Read from './Read'
import Write from './Write'
import { toast } from './components/Toast'
import { ToastContainer } from './components/Toast'

export default function App () {
  const [enterAction, setEnterAction] = useState({})
  const [route, setRoute] = useState('')

  // 显示消息并延迟退出
  const showMessageAndExit = (message) => {
    console.log('显示消息:', message)
    toast(message)
    // 等待 1.5 秒后退出，确保消息显示完整
    setTimeout(() => {
      window.utools.outPlugin()
    }, 1500)
  }

  // 从指定词库中取词
  const pickWordFromRepo = (repo) => {
    console.log('从词库取词:', repo)
    if (!repo.words.length) {
      showMessageAndExit(`词库"${repo.name}"中没有可用的词条`)
      return
    }

    // 从词库中随机选择一个词条
    const word = repo.words[Math.floor(Math.random() * repo.words.length)]
    console.log('选中的词条:', word)

    // 复制到剪贴板
    navigator.clipboard.writeText(word).then(() => {
      console.log('复制成功')
      // 如果设置为取出后移到回收站
      if (repo.settings.pickMode === 'recycle') {
        const now = Date.now()
        const updatedRepo = {
          ...repo,
          words: repo.words.filter(w => w !== word),
          recycled: [
            ...repo.recycled,
            { word, recycleDate: now }
          ]
        }

        window.services.repository.updateRepository(repo.id, {
          words: updatedRepo.words,
          recycled: updatedRepo.recycled
        })
      }

      showMessageAndExit(`已从"${repo.name}"复制：${word}`)
    }).catch((error) => {
      console.error('复制失败:', error)
      showMessageAndExit('复制失败')
    })
  }

  // 模糊匹配词库
  const fuzzyMatchRepo = (repos, searchText) => {
    const lowerSearchText = searchText.toLowerCase()
    const matchedRepos = repos.filter(repo => 
      repo.name.toLowerCase().includes(lowerSearchText)
    )
    console.log('模糊匹配结果:', matchedRepos)
    return matchedRepos
  }

  // 处理快速取词
  const handleQuickPick = (text) => {
    console.log('处理快速取词:', text)

    // 获取所有词库
    const repos = window.services.repository.getAllRepositories()
    console.log('获取到的词库列表:', repos)
    
    if (repos.length === 0) {
      showMessageAndExit('没有可用的词库')
      return
    }

    let targetRepo = null

    // 尝试将文本解析为数字
    const index = parseInt(text) - 1
    if (!isNaN(index)) {
      console.log('按序号查找词库:', index + 1)
      // 按序号选择词库
      if (index >= 0 && index < repos.length) {
        targetRepo = repos[index]
      } else {
        showMessageAndExit(`词库序号 ${index + 1} 不存在`)
        return
      }
    } else {
      console.log('按名称模糊查找词库:', text)
      // 模糊匹配词库
      const matchedRepos = fuzzyMatchRepo(repos, text)
      
      if (matchedRepos.length === 0) {
        showMessageAndExit(`未找到匹配的词库："${text}"`)
        return
      }
      
      if (matchedRepos.length > 1) {
        const repoNames = matchedRepos.map((repo, idx) => `${idx + 1}.${repo.name}`).join('\n')
        showMessageAndExit(`找到多个匹配的词库:\n${repoNames}\n请输入更精确的名称`)
        return
      }

      targetRepo = matchedRepos[0]
    }

    console.log('找到目标词库:', targetRepo)
    pickWordFromRepo(targetRepo)
  }

  useEffect(() => {
    window.utools.onPluginEnter((action) => {
      console.log('插件进入:', action)
      if (action.code === 'quick-pick') {
        handleQuickPick(action.payload)
        return
      }

      if (action.code === 'word-picker') {
        setRoute('word-picker')
        setEnterAction(action)
        return
      }

      setRoute(action.code)
      setEnterAction(action)
    })

    window.utools.onPluginOut(() => {
      setRoute('')
    })
  }, [])

  return (
    <>
      {route === 'word-picker' && <Dashboard />}
      {route === 'hello' && <Hello enterAction={enterAction} />}
      {route === 'read' && <Read enterAction={enterAction} />}
      {route === 'write' && <Write enterAction={enterAction} />}
      <ToastContainer />
    </>
  )
}
