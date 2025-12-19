import React from 'react';
import { useLocation, Redirect } from 'wouter';

const ProtectedRoute = ({ component: Component, allowedRole, allowedEmail, ...rest }) => {
  const [location] = useLocation();
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return <Redirect to="/login" />;
  }

  const user = JSON.parse(storedUser);

  // If allowedEmail is specified, enforce it strictly
  if (allowedEmail && user.email !== allowedEmail) {
      return <Redirect to="/" />;
  }

  // If allowedRole is specified, enforce it
  if (allowedRole && user.role !== allowedRole) {
    // Redirect to their correct dashboard to be helpful
    const correctPath = user.role === 'creator' ? '/dashboard/creator' : '/dashboard/fan';
    return <Redirect to={correctPath} />;
  }

  // If no restrictions or all match, render component
  return <Component {...rest} />;
};

export default ProtectedRoute;
