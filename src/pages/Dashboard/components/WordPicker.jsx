import { useState } from 'react'
import { toast } from '../../../components/Toast'

export default function WordPicker({ repositories, onUpdate }) {
  const [draggedRepo, setDraggedRepo] = useState(null)

  // 开始拖动
  const handleDragStart = (e, repo) => {
    // 不要阻止默认拖动行为
    // e.preventDefault()  // 删除这行
    // e.stopPropagation() // 删除这行
    
    // 设置拖动数据
    e.dataTransfer.effectAllowed = 'move'
    setDraggedRepo(repo)
  }

  // 拖动结束
  const handleDragEnd = () => {
    setDraggedRepo(null)
  }

  // 拖动进入目标区域
  const handleDragOver = (e) => {
    e.preventDefault()
  }

  // 放置到目标位置
  const handleDrop = (targetRepo) => {
    if (!draggedRepo || draggedRepo.id === targetRepo.id) return

    // 获取源和目标的索引
    const sourceIndex = repositories.findIndex(r => r.id === draggedRepo.id)
    const targetIndex = repositories.findIndex(r => r.id === targetRepo.id)

    // 重新排序
    const newRepos = [...repositories]
    newRepos.splice(sourceIndex, 1)
    newRepos.splice(targetIndex, 0, draggedRepo)

    // 为每个词库更新 order 属性
    const updatedRepos = newRepos.map((repo, index) => ({
      ...repo,
      order: index
    }))

    // 逐个更新词库的顺序
    let success = true
    for (const repo of updatedRepos) {
      if (!window.services.repository.updateRepository(repo.id, { order: repo.order })) {
        success = false
        break
      }
    }

    // 如果全部更新成功，更新 UI
    if (success) {
      onUpdate(updatedRepos)
    }
  }

  // 取词功能实现
  const handlePickWord = (repo) => {
    if (!repo.words.length) return

    // 根据设置决定取词方式
    const word = repo.settings.pickOrder === 'random'
      ? repo.words[Math.floor(Math.random() * repo.words.length)]
      : repo.words[0]

    // 复制到剪贴板
    navigator.clipboard.writeText(word).then(() => {
      toast(`已复制：${word}`)

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

        if (window.services.repository.updateRepository(repo.id, {
          words: updatedRepo.words,
          recycled: updatedRepo.recycled
        })) {
          // 更新父组件的词库数据
          onUpdate(repositories.map(r => 
            r.id === repo.id ? updatedRepo : r
          ))
        }
      }
    }).catch(() => {
      toast('复制失败')
    })
  }

  return (
    <div className="word-picker">
      <div className="repo-grid">
        {repositories.map(repo => (
          <div 
            key={repo.id} 
            className={`repo-card ${draggedRepo?.id === repo.id ? 'dragging' : ''}`}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, repo)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(repo)}
          >
            <div className="repo-cover">
              {repo.cover ? (
                <img 
                  src={repo.cover} 
                  alt="词库封面" 
                  draggable={false}
                />
              ) : (
                <div className="cover-placeholder">
                  {repo.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="repo-info">
              <span className="repo-name">{repo.name}</span>
              <button
                className="pick-btn"
                onClick={() => handlePickWord(repo)}
                disabled={!repo.words.length}
                draggable={false}
              >
                取词 ({repo.words.length})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 