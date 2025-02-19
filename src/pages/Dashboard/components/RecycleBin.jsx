import { useState } from 'react'

export default function RecycleBin({ repository, onUpdate }) {
  const [selectedWords, setSelectedWords] = useState(new Set())

  // 从回收站恢复
  const handleRestoreWords = (words) => {
    if (window.services.repository.updateRepository(repository.id, {
      words: [...repository.words, ...words],
      recycled: repository.recycled.filter(item => !words.includes(item.word))
    })) {
      onUpdate({
        ...repository,
        words: [...repository.words, ...words],
        recycled: repository.recycled.filter(item => !words.includes(item.word))
      })
      setSelectedWords(new Set())
    }
  }

  // 清空回收站
  const handleClearRecycled = () => {
    if (window.confirm('确定要清空回收站吗？')) {
      if (window.services.repository.updateRepository(repository.id, {
        recycled: []
      })) {
        onUpdate({
          ...repository,
          recycled: []
        })
      }
    }
  }

  // 切换词条选择
  const toggleWordSelection = (word) => {
    const newSelection = new Set(selectedWords)
    if (newSelection.has(word)) {
      newSelection.delete(word)
    } else {
      newSelection.add(word)
    }
    setSelectedWords(newSelection)
  }

  return (
    <div className="recycled-section">
      <div className="recycled-header">
        <h3>回收站</h3>
        <div className="recycled-actions">
          <button 
            className="btn btn-primary"
            onClick={() => handleRestoreWords(Array.from(selectedWords))}
            disabled={selectedWords.size === 0}
          >
            还原选中
          </button>
          <button 
            className="btn btn-danger"
            onClick={handleClearRecycled}
            disabled={repository.recycled.length === 0}
          >
            清空回收站
          </button>
        </div>
      </div>

      <div className="words-list">
        {repository.recycled.map((item, index) => (
          <div
            key={index}
            className={`word-item ${selectedWords.has(item.word) ? 'selected' : ''}`}
            onClick={() => toggleWordSelection(item.word)}
          >
            <span className="word-text">{item.word}</span>
            <span className="recycle-date">
              {new Date(item.recycleDate).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
} 