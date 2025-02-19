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
        <div className="recycled-actions">
          {selectedWords.size > 0 && (
            <button 
              className="restore-btn"
              onClick={() => handleRestoreWords(Array.from(selectedWords))}
            >
              恢复选中 ({selectedWords.size})
            </button>
          )}
          <button 
            className="clear-btn"
            onClick={handleClearRecycled}
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