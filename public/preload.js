// 初始化服务对象
window.services = {}

const fs = require('fs')
const path = require('path')
const crypto = require('node:crypto')

// 生成唯一ID
function generateId() {
  return crypto.randomBytes(16).toString('hex')
}

// 获取数据目录路径
const DATA_DIR = window.utools.getPath('userData')
const REPOS_FILE = path.join(DATA_DIR, 'repositories.json')

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 确保仓库文件存在
if (!fs.existsSync(REPOS_FILE)) {
  fs.writeFileSync(REPOS_FILE, '[]', 'utf8')
}

// 仓库服务
window.services.repository = {
  // 获取所有仓库
  getAllRepositories() {
    try {
      const data = fs.readFileSync(REPOS_FILE, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error('读取仓库数据失败:', error)
      return []
    }
  },

  // 创建仓库
  createRepository(name) {
    try {
      const repos = this.getAllRepositories()
      const newRepo = {
        id: generateId(),
        name,
        cover: null,
        words: [],
        recycled: [],
        settings: {
          pickMode: 'recycle',  // 默认取出后移到回收站
          pickOrder: 'random',  // 默认随机取词
          recycleExpireDays: 7, // 默认7天过期
          neverExpire: false    // 默认不永久保存
        }
      }
      repos.push(newRepo)
      fs.writeFileSync(REPOS_FILE, JSON.stringify(repos, null, 2), 'utf8')
      return newRepo
    } catch (error) {
      console.error('创建仓库失败:', error)
      return null
    }
  },

  // 更新仓库
  updateRepository(id, updates) {
    try {
      const repos = this.getAllRepositories()
      const index = repos.findIndex(repo => repo.id === id)
      if (index === -1) return false

      repos[index] = {
        ...repos[index],
        ...updates
      }
      fs.writeFileSync(REPOS_FILE, JSON.stringify(repos, null, 2), 'utf8')
      return true
    } catch (error) {
      console.error('更新仓库失败:', error)
      return false
    }
  },

  // 删除仓库
  deleteRepository(id) {
    try {
      const repos = this.getAllRepositories()
      const filtered = repos.filter(repo => repo.id !== id)
      fs.writeFileSync(REPOS_FILE, JSON.stringify(filtered, null, 2), 'utf8')
      return true
    } catch (error) {
      console.error('删除仓库失败:', error)
      return false
    }
  },

  // 清理过期的回收站词条
  cleanExpiredRecycled() {
    try {
      const repos = this.getAllRepositories()
      let hasChanges = false

      repos.forEach(repo => {
        if (repo.settings.neverExpire) return // 如果设置了永不过期则跳过

        const now = Date.now()
        const expireTime = repo.settings.recycleExpireDays * 24 * 60 * 60 * 1000
        const validRecycled = repo.recycled.filter(item => {
          return (now - item.recycleDate) < expireTime
        })

        if (validRecycled.length !== repo.recycled.length) {
          repo.recycled = validRecycled
          hasChanges = true
        }
      })

      if (hasChanges) {
        fs.writeFileSync(REPOS_FILE, JSON.stringify(repos, null, 2), 'utf8')
      }
    } catch (error) {
      console.error('清理过期词条失败:', error)
    }
  }
}

// 定期清理过期的回收站词条
setInterval(() => {
  window.services.repository.cleanExpiredRecycled()
}, 60 * 60 * 1000) // 每小时检查一次

// 调试输出
console.log('preload.js loaded, services:', window.services) 