import React from 'react'
import { Route, Switch } from 'wouter'
import ModernLanding from './components/ModernLanding'
import Login from './pages/Login'
import './index.css'
import './refined_theme.css'

function App() {
  return (
    <Switch>
      <Route path="/" component={ModernLanding} />
      <Route path="/login" component={Login} />
      <Route>404: No such page!</Route>
    </Switch>
  )
}

export default App
