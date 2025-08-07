import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

export const RouterWrapper = ({ children }) => {
  return <Router>{children}</Router>;
};
