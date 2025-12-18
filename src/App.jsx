import React from 'react'
import { Route, Switch } from 'wouter'
import ModernLanding from './components/ModernLanding'
import Login from './pages/Login'
import Register from './pages/Register'
import FanDashboard from './pages/FanDashboard'
import CreatorDashboard from './pages/CreatorDashboard'
import './index.css'
import './refined_theme.css'

function App() {
  return (
    <Switch>
      <Route path="/" component={ModernLanding} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard/fan" component={FanDashboard} />
      <Route path="/dashboard/creator" component={CreatorDashboard} />
      <Route path="/dashboard/fan/:subpage" component={FanDashboard} />
      <Route path="/dashboard/creator/:subpage" component={CreatorDashboard} />
      <Route>404: No such page!</Route>
    </Switch>
  )
}

export default App
