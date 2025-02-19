import { useState } from 'react'
import { toast } from '../../../components/Toast'

export default function WordPicker({ repositories, onUpdate }) {
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
          // 更新父组件的仓库数据
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
          <div key={repo.id} className="repo-card">
            <div className="repo-cover">
              {repo.cover ? (
                <img src={repo.cover} alt={repo.name} />
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