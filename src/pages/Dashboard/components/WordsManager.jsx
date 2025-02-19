import { useState } from 'react'

const PRESET_SEPARATORS = [
  { label: '换行', value: '\n' },
  { label: '逗号', value: ',' },
  { label: '空格', value: ' ' },
  { label: '分号', value: ';' },
  { label: '竖线', value: '|' }
]

export default function WordsManager({ repository, onUpdate }) {
  const [showAddWords, setShowAddWords] = useState(false)
  const [newWords, setNewWords] = useState('')
  const [selectedSeparators, setSelectedSeparators] = useState(new Set(['\n']))
  const [selectedWords, setSelectedWords] = useState(new Set())

  // 添加词条
  const handleAddWords = () => {
    if (!newWords.trim()) return
    let words = [newWords]
    selectedSeparators.forEach(sep => {
      words = words.flatMap(text => text.split(sep))
    })
    
    const finalWords = words
      .map(w => w.trim())
      .filter(w => w)

    if (window.services.repository.updateRepository(repository.id, {
      words: [...repository.words, ...finalWords]
    })) {
      onUpdate({
        ...repository,
        words: [...repository.words, ...finalWords]
      })
      setNewWords('')
      setShowAddWords(false)
    }
  }

  // 删除选中的词条
  const handleDeleteWords = () => {
    if (!selectedWords.size) return
    if (window.confirm(`确定要删除选中的 ${selectedWords.size} 个词条吗？`)) {
      const selectedArray = Array.from(selectedWords)
      const now = Date.now()
      
      if (window.services.repository.updateRepository(repository.id, {
        words: repository.words.filter(w => !selectedWords.has(w)),
        recycled: [
          ...repository.recycled,
          ...selectedArray.map(word => ({
            word,
            recycleDate: now
          }))
        ]
      })) {
        onUpdate({
          ...repository,
          words: repository.words.filter(w => !selectedWords.has(w)),
          recycled: [
            ...repository.recycled,
            ...selectedArray.map(word => ({
              word,
              recycleDate: now
            }))
          ]
        })
        setSelectedWords(new Set())
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

  // 切换分隔符选择
  const toggleSeparator = (value) => {
    const newSelection = new Set(selectedSeparators)
    if (newSelection.has(value)) {
      newSelection.delete(value)
    } else {
      newSelection.add(value)
    }
    setSelectedSeparators(newSelection)
  }

  return (
    <div className="words-section">
      <div className="words-header">
        <h3>词条管理</h3>
        <div className="words-actions">
          <button 
            className="btn btn-danger"
            onClick={handleDeleteWords}
            disabled={selectedWords.size === 0}
          >
            删除选中 ({selectedWords.size})
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddWords(true)}
          >
            添加词条
          </button>
        </div>
      </div>

      {showAddWords && (
        <div className="add-words-form">
          <textarea
            value={newWords}
            onChange={e => setNewWords(e.target.value)}
            placeholder="输入词条，多个词条可用换行、逗号、空格等分隔"
          />
          <div className="form-footer">
            <div className="separator-options">
              <label>分隔符：</label>
              <div className="separator-list">
                {PRESET_SEPARATORS.map(({ label, value }) => (
                  <label key={value} className="separator-item">
                    <input
                      type="checkbox"
                      checked={selectedSeparators.has(value)}
                      onChange={() => toggleSeparator(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button 
                className="btn btn-primary"
                onClick={handleAddWords}
                disabled={!newWords.trim()}
              >
                添加
              </button>
              <button 
                className="btn"
                onClick={() => {
                  setShowAddWords(false)
                  setNewWords('')
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="words-list">
        {repository.words.map((word, index) => (
          <div
            key={index}
            className={`word-item ${selectedWords.has(word) ? 'selected' : ''}`}
            onClick={() => toggleWordSelection(word)}
          >
            <span className="word-text">{word}</span>
          </div>
        ))}
      </div>
    </div>
  )
} 