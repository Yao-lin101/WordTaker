import { useState } from 'react'

export default function RepositoryList({ 
  repositories, 
  selectedRepo, 
  onSelect,
  onUpdate,
  onDelete 
}) {
  const [showNewRepo, setShowNewRepo] = useState(false)
  const [newRepoName, setNewRepoName] = useState('')
  const [editingName, setEditingName] = useState(null)
  const [editingNameValue, setEditingNameValue] = useState('')

  // 创建新仓库
  const handleCreateRepo = () => {
    if (!newRepoName.trim()) return
    const newRepo = window.services.repository.createRepository(newRepoName)
    if (newRepo) {
      onUpdate([...repositories, newRepo])
      setNewRepoName('')
      setShowNewRepo(false)
    }
  }

  // 开始编辑名称
  const handleStartEditName = (repo) => {
    setEditingName(repo.id)
    setEditingNameValue(repo.name)
  }

  // 保存编辑后的名称
  const handleSaveName = () => {
    if (!editingNameValue.trim()) return
    if (window.services.repository.updateRepository(editingName, { name: editingNameValue })) {
      onUpdate(repositories.map(repo =>
        repo.id === editingName
          ? { ...repo, name: editingNameValue }
          : repo
      ))
    }
    setEditingName(null)
    setEditingNameValue('')
  }

  return (
    <div className="repo-list">
      <div className="repo-list-header">
        <h2>仓库列表</h2>
        <button 
          className="btn btn-primary new-repo-btn"
          onClick={() => setShowNewRepo(true)}
        >
          <span>+</span>
          新建仓库
        </button>
      </div>

      {showNewRepo && (
        <div className="new-repo-form">
          <input
            type="text"
            value={newRepoName}
            onChange={e => setNewRepoName(e.target.value)}
            placeholder="输入仓库名称"
            autoFocus
          />
          <button 
            className="btn-confirm"
            onClick={handleCreateRepo}
            disabled={!newRepoName.trim()}
          >
            确定
          </button>
          <button 
            className="btn-cancel"
            onClick={() => {
              setShowNewRepo(false)
              setNewRepoName('')
            }}
          >
            取消
          </button>
        </div>
      )}

      <div className="repo-items">
        {repositories.map(repo => (
          <div 
            key={repo.id} 
            className={`repo-item ${selectedRepo?.id === repo.id ? 'selected' : ''}`}
            onClick={() => onSelect(repo)}
          >
            <div className="repo-header">
              <span className="repo-name">
                {editingName === repo.id ? (
                  <input
                    type="text"
                    value={editingNameValue}
                    onChange={e => setEditingNameValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') {
                        setEditingName(null)
                        setEditingNameValue('')
                      }
                    }}
                    onBlur={handleSaveName}
                    onClick={e => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <>
                    {repo.name}
                    <button 
                      className="edit-name-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEditName(repo)
                      }}
                    >
                      ✎
                    </button>
                  </>
                )}
              </span>
            </div>
            <span className="repo-stats">
              {repo.words.length} 词条 | {repo.recycled.length} 回收
            </span>
            <button 
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(repo.id)
              }}
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  )
} 