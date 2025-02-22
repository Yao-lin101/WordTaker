import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Hello from './Hello'
import Read from './Read'
import Write from './Write'
import { toast } from './components/Toast'
import { ToastContainer } from './components/Toast'

export default function App () {
  const [enterAction, setEnterAction] = useState({})
  const [route, setRoute] = useState('')


  useEffect(() => {
    window.utools.onPluginEnter((action) => {
      console.log('插件进入:', action)
      if (action.code === 'word-picker') {
        setRoute('word-picker')
        setEnterAction(action)
        return
      }

      setRoute(action.code)
      setEnterAction(action)
    })

    window.utools.onPluginOut(() => {
      setRoute('')
    })
  }, [])

  return (
    <>
      {route === 'word-picker' && <Dashboard />}
      {route === 'hello' && <Hello enterAction={enterAction} />}
      {route === 'read' && <Read enterAction={enterAction} />}
      {route === 'write' && <Write enterAction={enterAction} />}
      <ToastContainer />
    </>
  )
}
