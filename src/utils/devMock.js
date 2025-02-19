// 开发环境模拟 uTools API
if (process.env.NODE_ENV === 'development' && !window.utools) {
  window.utools = {
    // 基础事件
    onPluginEnter: (callback) => {
      console.log('模拟插件进入')
      // 模拟调用回调，传入默认的 word-picker 路由
      callback({
        code: 'word-picker',
        type: 'text',
        payload: ''
      })
    },
    onPluginOut: (callback) => {
      console.log('模拟插件退出')
    },
    // 工具方法
    showNotification: (msg) => {
      console.log('通知:', msg)
    },
    // 获取用户数据目录
    getPath: (name) => {
      return name === 'userData' ? './dev-data' : './'
    }
  }

  // 模拟 Node.js 服务
  window.services = {
    repository: {
      getAllRepositories: () => {
        try {
          const data = localStorage.getItem('repositories')
          const repos = data ? JSON.parse(data) : []
          // 添加排序逻辑
          return repos.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
        } catch {
          return []
        }
      },
      saveRepositories: (repositories) => {
        try {
          localStorage.setItem('repositories', JSON.stringify(repositories))
          return true
        } catch {
          return false
        }
      },
      // 其他方法直接使用内存存储
      createRepository: (name, settings = {}) => {
        const repositories = window.services.repository.getAllRepositories()
        const newRepo = {
          id: Date.now().toString(36),
          name,
          order: repositories.length, // 添加 order 属性
          settings: {
            pickMode: 'return',
            pickOrder: 'random',
            separator: ',',
            recycleExpireDays: 7,
            ...settings
          },
          words: [],
          recycled: []
        }
        repositories.push(newRepo)
        window.services.repository.saveRepositories(repositories)
        return newRepo
      },
      updateRepository: (id, updates) => {
        try {
          const repositories = window.services.repository.getAllRepositories()
          const index = repositories.findIndex(repo => repo.id === id)
          if (index === -1) return false

          repositories[index] = {
            ...repositories[index],
            ...updates
          }
          localStorage.setItem('repositories', JSON.stringify(repositories))
          return true
        } catch {
          return false
        }
      },
      deleteRepository: (id) => {
        const repositories = window.services.repository.getAllRepositories()
        const filtered = repositories.filter(repo => repo.id !== id)
        return window.services.repository.saveRepositories(filtered)
      }
    }
  }
} 