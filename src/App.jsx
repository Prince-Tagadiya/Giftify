import React from 'react'
import { Route, Switch } from 'wouter'
import ModernLanding from './components/ModernLanding'
import Login from './pages/Login'
import Register from './pages/Register'
import FanDashboard from './pages/FanDashboard'
import CreatorDashboard from './pages/CreatorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import LogisticsDashboard from './pages/LogisticsDashboard' // Added import
import ProtectedRoute from './components/ProtectedRoute'
import { ToastProvider } from './components/ToastContext'
import './refined_theme.css'

function App() {
  return (
    <ToastProvider>
      <Switch>
        <Route path="/" component={ModernLanding} />
        <Route path="/dashboard/admin">
          <ProtectedRoute component={AdminDashboard} allowedRole="admin" />
        </Route>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard/fan">
          <ProtectedRoute component={FanDashboard} allowedRole="fan" />
        </Route>
        <Route path="/dashboard/creator">
          <ProtectedRoute component={CreatorDashboard} allowedRole="creator" />
        </Route>
        <Route path="/dashboard/logistics">
            {/* Strictly restricted to one single credential as requested */}
            <ProtectedRoute component={LogisticsDashboard} allowedEmail="logistics@giftify.com" />
        </Route>

        <Route path="/dashboard/fan/:subpage">
            {(params) => <ProtectedRoute component={FanDashboard} allowedRole="fan" params={params} />}
        </Route>
        <Route path="/dashboard/creator/:subpage">
            {(params) => <ProtectedRoute component={CreatorDashboard} allowedRole="creator" params={params} />}
        </Route>


        <Route>404: No such page!</Route>
      </Switch>
    </ToastProvider>
  )
}

export default App
