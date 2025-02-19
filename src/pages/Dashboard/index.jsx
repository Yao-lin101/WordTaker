import { useState, useEffect, useRef } from 'react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import './index.css'
import RepositoryList from './components/RepositoryList'
import WordsManager from './components/WordsManager'
import RecycleBin from './components/RecycleBin'
import Settings from './components/Settings'
import WordPicker from './components/WordPicker'
import { ToastContainer } from '../../components/Toast'

// 在 RepositoryManager 组件前添加预设分隔符常量
const PRESET_SEPARATORS = [
  { label: '换行', value: '\n' },
  { label: '逗号', value: ',' },
  { label: '空格', value: ' ' },
  { label: '分号', value: ';' },
  { label: '竖线', value: '|' }
]

// 子组件：词库管理
function RepositoryManager({ repositories, setRepositories }) {
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [activeTab, setActiveTab] = useState('words')

  // 当选中的词库ID变化时，更新选中的词库数据
  useEffect(() => {
    if (selectedRepo) {
      const updatedRepo = repositories.find(repo => repo.id === selectedRepo.id)
      if (updatedRepo) {
        setSelectedRepo(updatedRepo)
      }
    }
  }, [repositories, selectedRepo?.id])

  // 删除词库
  const handleDeleteRepo = (id) => {
    if (window.confirm('确定要删除这个词库吗？')) {
      if (window.services.repository.deleteRepository(id)) {
        setRepositories(repositories.filter(repo => repo.id !== id))
        if (selectedRepo?.id === id) {
          setSelectedRepo(null)
        }
      }
    }
  }

  return (
    <div className="repository-manager">
      <RepositoryList
        repositories={repositories}
        selectedRepo={selectedRepo}
        onSelect={setSelectedRepo}
        onUpdate={setRepositories}
        onDelete={handleDeleteRepo}
      />

      {selectedRepo && (
        <div className="repo-detail">
          <h2>{selectedRepo.name}</h2>
          
          <div className="detail-tabs">
            <div 
              className={`tab-item ${activeTab === 'words' ? 'active' : ''}`}
              onClick={() => setActiveTab('words')}
            >
              词条管理
            </div>
            <div 
              className={`tab-item ${activeTab === 'recycled' ? 'active' : ''}`}
              onClick={() => setActiveTab('recycled')}
            >
              回收站
            </div>
            <div 
              className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              词库设置
            </div>
          </div>

          {activeTab === 'words' && (
            <WordsManager 
              repository={selectedRepo}
              onUpdate={(updatedRepo) => {
                setRepositories(repositories.map(repo =>
                  repo.id === selectedRepo.id ? updatedRepo : repo
                ))
              }}
            />
          )}

          {activeTab === 'recycled' && (
            <RecycleBin
              repository={selectedRepo}
              onUpdate={(updatedRepo) => {
                setRepositories(repositories.map(repo =>
                  repo.id === selectedRepo.id ? updatedRepo : repo
                ))
              }}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              repository={selectedRepo}
              onUpdate={(updatedRepo) => {
                setRepositories(repositories.map(repo =>
                  repo.id === selectedRepo.id ? updatedRepo : repo
                ))
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

// 主组件
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('picker')
  const [repositories, setRepositories] = useState([])

  // 加载词库列表
  useEffect(() => {
    try {
      if (!window.services?.repository) {
        console.error('Repository service not available')
        return
      }
      const repos = window.services.repository.getAllRepositories()
      setRepositories(repos)
    } catch (error) {
      console.error('Failed to load repositories:', error)
    }
  }, [])

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div 
          className={`nav-item ${activeTab === 'picker' ? 'active' : ''}`}
          onClick={() => setActiveTab('picker')}
        >
          取词
        </div>
        <div 
          className={`nav-item ${activeTab === 'repos' ? 'active' : ''}`}
          onClick={() => setActiveTab('repos')}
        >
          词库管理
        </div>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'picker' ? (
          <WordPicker 
            repositories={repositories} 
            onUpdate={setRepositories}
          />
        ) : (
          <RepositoryManager 
            repositories={repositories}
            setRepositories={setRepositories}
          />
        )}
      </div>
      <ToastContainer />
    </div>
  )
} 