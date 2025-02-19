const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

// 生成唯一ID
function generateId() {
  return crypto.randomBytes(16).toString('hex')
}

// 获取数据存储路径
function getStoragePath() {
  // uTools 数据目录
  const userDataPath = window.utools.getPath('userData')
  return path.join(userDataPath, 'word-picker-data.json')
}

// 默认仓库设置
const DEFAULT_SETTINGS = {
  pickMode: 'return', // return: 取出后放回, recycle: 取出后移到回收站
  pickOrder: 'random', // random: 随机, sequence: 顺序
  recycleExpireDays: 7 // 回收站过期天数
}

// 仓库服务
const RepositoryService = {
  // 获取所有仓库数据
  getAllRepositories() {
    try {
      const storagePath = getStoragePath()
      if (!fs.existsSync(storagePath)) {
        return []
      }
      const data = fs.readFileSync(storagePath, 'utf-8')
      return JSON.parse(data)
    } catch (err) {
      console.error('Failed to read repositories:', err)
      return []
    }
  },

  // 保存所有仓库数据
  saveRepositories(repositories) {
    try {
      const storagePath = getStoragePath()
      fs.writeFileSync(storagePath, JSON.stringify(repositories, null, 2))
      return true
    } catch (err) {
      console.error('Failed to save repositories:', err)
      return false
    }
  },

  // 创建新仓库
  createRepository(name, settings = {}) {
    const repositories = this.getAllRepositories()
    const newRepo = {
      id: generateId(),
      name,
      settings: { ...DEFAULT_SETTINGS, ...settings },
      words: [],
      recycled: []
    }
    repositories.push(newRepo)
    return this.saveRepositories(repositories) ? newRepo : null
  },

  // 更新仓库
  updateRepository(id, data) {
    const repositories = this.getAllRepositories()
    const index = repositories.findIndex(repo => repo.id === id)
    if (index === -1) return false
    
    repositories[index] = {
      ...repositories[index],
      ...data,
      settings: {
        ...repositories[index].settings,
        ...(data.settings || {})
      }
    }
    return this.saveRepositories(repositories)
  },

  // 删除仓库
  deleteRepository(id) {
    const repositories = this.getAllRepositories()
    const filteredRepos = repositories.filter(repo => repo.id !== id)
    return this.saveRepositories(filteredRepos)
  },

  // 添加词条
  addWords(repoId, text, separator = null) {
    const repositories = this.getAllRepositories()
    const repo = repositories.find(r => r.id === repoId)
    if (!repo) return false

    const sep = separator || repo.settings.separator
    const newWords = text.split(sep).map(w => w.trim()).filter(w => w)
    repo.words.push(...newWords)
    
    return this.saveRepositories(repositories)
  },

  // 取词
  pickWord(repoId) {
    const repositories = this.getAllRepositories()
    const repo = repositories.find(r => r.id === repoId)
    if (!repo || !repo.words.length) return null

    let word
    if (repo.settings.pickOrder === 'random') {
      const index = Math.floor(Math.random() * repo.words.length)
      word = repo.words[index]
      if (repo.settings.pickMode === 'recycle') {
        repo.words.splice(index, 1)
        repo.recycled.push({
          word,
          recycleDate: new Date().toISOString()
        })
      }
    } else {
      word = repo.words[0]
      if (repo.settings.pickMode === 'recycle') {
        repo.words.shift()
        repo.recycled.push({
          word,
          recycleDate: new Date().toISOString()
        })
      }
    }

    this.saveRepositories(repositories)
    return word
  },

  // 从回收站恢复
  restoreWords(repoId, words) {
    const repositories = this.getAllRepositories()
    const repo = repositories.find(r => r.id === repoId)
    if (!repo) return false

    const wordsSet = new Set(words)
    repo.recycled = repo.recycled.filter(item => {
      if (wordsSet.has(item.word)) {
        repo.words.push(item.word)
        return false
      }
      return true
    })

    return this.saveRepositories(repositories)
  },

  // 清理过期回收数据
  cleanExpiredWords(repoId) {
    const repositories = this.getAllRepositories()
    const repo = repositories.find(r => r.id === repoId)
    if (!repo) return false

    const now = new Date()
    repo.recycled = repo.recycled.filter(item => {
      const recycleDate = new Date(item.recycleDate)
      const diffDays = (now - recycleDate) / (1000 * 60 * 60 * 24)
      return diffDays <= repo.settings.recycleExpireDays
    })

    return this.saveRepositories(repositories)
  }
}

// 注入到 window 对象
window.services = {
  ...window.services,
  repository: RepositoryService
} 