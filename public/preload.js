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

// 确保词库文件存在
if (!fs.existsSync(REPOS_FILE)) {
  fs.writeFileSync(REPOS_FILE, '[]', 'utf8')
}

// 词库服务
window.services.repository = {
  // 获取所有词库
  getAllRepositories() {
    try {
      const data = fs.readFileSync(REPOS_FILE, 'utf8')
      const repos = JSON.parse(data)
      // 按 order 排序，如果没有 order 属性则放到最后
      return repos.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
    } catch (error) {
      console.error('读取词库数据失败:', error)
      return []
    }
  },

  // 创建词库
  createRepository(name) {
    try {
      const repos = this.getAllRepositories()
      const newRepo = {
        id: generateId(),
        name,
        cover: null,
        words: [],
        recycled: [],
        order: repos.length, // 添加 order 属性
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
      console.error('创建词库失败:', error)
      return null
    }
  },

  // 更新词库
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
      console.error('更新词库失败:', error)
      return false
    }
  },

  // 删除词库
  deleteRepository(id) {
    try {
      const repos = this.getAllRepositories()
      const filtered = repos.filter(repo => repo.id !== id)
      fs.writeFileSync(REPOS_FILE, JSON.stringify(filtered, null, 2), 'utf8')
      return true
    } catch (error) {
      console.error('删除词库失败:', error)
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
  },

  // 一次性更新所有词库
  updateAllRepositories(repositories) {
    try {
      // 保持现有词库的其他属性不变，只更新顺序
      const currentRepos = this.getAllRepositories()
      const updatedRepos = repositories.map(repo => {
        const currentRepo = currentRepos.find(r => r.id === repo.id)
        return {
          ...currentRepo,
          order: repo.order
        }
      })
      
      fs.writeFileSync(REPOS_FILE, JSON.stringify(updatedRepos, null, 2), 'utf8')
      return true
    } catch (error) {
      console.error('更新词库失败:', error)
      return false
    }
  },

  // 快速取词功能
  quickPick(searchText) {
    try {
      // 获取所有词库
      const repos = this.getAllRepositories()
      if (repos.length === 0) {
        return { success: false, message: '没有可用的词库' }
      }

      let targetRepo = null

      // 尝试将文本解析为数字
      const index = parseInt(searchText) - 1
      if (!isNaN(index)) {
        // 按序号选择词库
        if (index >= 0 && index < repos.length) {
          targetRepo = repos[index]
        } else {
          return { success: false, message: `词库序号 ${index + 1} 不存在` }
        }
      } else {
        // 模糊匹配词库名称
        const matchedRepos = repos.filter(repo => 
          repo.name.toLowerCase().includes(searchText.toLowerCase())
        )
        
        if (matchedRepos.length === 0) {
          return { success: false, message: `未找到匹配的词库："${searchText}"` }
        }
        
        if (matchedRepos.length > 1) {
          const repoNames = matchedRepos.map((repo, idx) => `${idx + 1}.${repo.name}`).join('\n')
          return { success: false, message: `找到多个匹配的词库:\n${repoNames}\n请输入更精确的名称` }
        }

        targetRepo = matchedRepos[0]
      }

      // 检查词库是否有可用词条
      if (!targetRepo.words.length) {
        return { success: false, message: `词库"${targetRepo.name}"中没有可用的词条` }
      }

      // 从词库中随机选择一个词条
      const word = targetRepo.words[Math.floor(Math.random() * targetRepo.words.length)]

      // 如果设置为取出后移到回收站
      if (targetRepo.settings.pickMode === 'recycle') {
        const now = Date.now()
        const updatedRepo = {
          ...targetRepo,
          words: targetRepo.words.filter(w => w !== word),
          recycled: [
            ...targetRepo.recycled,
            { word, recycleDate: now }
          ]
        }

        this.updateRepository(targetRepo.id, {
          words: updatedRepo.words,
          recycled: updatedRepo.recycled
        })
      }

      return { 
        success: true, 
        word,
        message: `已从"${targetRepo.name}"复制：${word}`
      }
    } catch (error) {
      console.error('快速取词失败:', error)
      return { success: false, message: '快速取词失败' }
    }
  }
}

// 定期清理过期的回收站词条
setInterval(() => {
  window.services.repository.cleanExpiredRecycled()
}, 60 * 60 * 1000) // 每小时检查一次

// 添加快速取词的处理函数
window.utools.onPluginEnter(({code, type, payload}) => {
  if (code === 'quick-pick') {
    const result = window.services.repository.quickPick(payload)
    
    if (result.success) {
      // 复制到剪贴板
      const textarea = document.createElement('textarea')
      textarea.value = result.word
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    // 显示结果消息
    window.utools.showNotification(result.message)
    
    // 退出插件
    window.utools.outPlugin()
  }
})

// 调试输出
console.log('preload.js loaded, services:', window.services) 