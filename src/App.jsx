import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Hello from './Hello'
import Read from './Read'
import Write from './Write'

export default function App () {
  const [enterAction, setEnterAction] = useState({})
  const [route, setRoute] = useState('')

  useEffect(() => {
    window.utools.onPluginEnter((action) => {
      setRoute(action.code)
      setEnterAction(action)
    })
    window.utools.onPluginOut(() => {
      setRoute('')
    })
  }, [])

  if (route === 'word-picker') {
    return <Dashboard />
  }

  if (route === 'hello') {
    return <Hello enterAction={enterAction} />
  }

  if (route === 'read') {
    return <Read enterAction={enterAction} />
  }

  if (route === 'write') {
    return <Write enterAction={enterAction} />
  }

  return false
}
