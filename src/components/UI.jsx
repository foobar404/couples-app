import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Button = ({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'default', 
  icon = false,
  className = '',
  ...props 
}) => {
  let btnClass = 'btn';
  
  if (variant === 'primary') btnClass += ' btn--primary';
  if (variant === 'secondary') btnClass += ' btn--secondary';
  if (variant === 'accent') btnClass += ' btn--accent';
  
  if (size === 'small') btnClass += ' btn--small';
  if (size === 'large') btnClass += ' btn--large';
  
  if (icon) btnClass += ' btn--icon';
  
  if (className) btnClass += ` ${className}`;

  return (
    <button className={btnClass} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

export const Card = ({ title, children, footer, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="card__header">
          <h3 className="card__title">{title}</h3>
        </div>
      )}
      <div className="card__body">
        {children}
      </div>
      {footer && (
        <div className="card__footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export const Widget = ({ title, action, children, onClick, to, className = '' }) => {
  const navigate = useNavigate();
  const widgetClass = `widget ${className}`;
  
  const handleClick = () => {
    if (to) {
      navigate(to);
    } else if (onClick) {
      onClick();
    }
  };
  
  const WidgetContent = () => (
    <>
      <div className="widget__header">
        <h3 className="widget__title">{title}</h3>
        {action && <span className="widget__action">{action}</span>}
      </div>
      {children}
    </>
  );

  if (to || onClick) {
    return (
      <div className={widgetClass} onClick={handleClick} style={{ cursor: 'pointer' }}>
        <WidgetContent />
      </div>
    );
  }

  return (
    <div className={widgetClass}>
      <WidgetContent />
    </div>
  );
};

export const Navigation = ({ tabs, activeTab, onTabChange }) => {
  return (
    <nav className="nav">
      <div className="nav__wave">
        {tabs.map((tab, index) => (
          <div key={tab.id} className="nav__item">
            <button
              className={`nav__button ${activeTab === tab.id ? 'nav__button--active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="nav__icon">{tab.icon}</span>
              <span className="nav__label">{tab.label}</span>
            </button>
          </div>
        ))}
      </div>
    </nav>
  );
};

export const Grid = ({ children, columns = 'auto', className = '' }) => {
  let gridClass = 'grid';
  
  if (columns === 2) gridClass += ' grid--2';
  else if (columns === 3) gridClass += ' grid--3';
  else if (columns === 'auto') gridClass += ' grid--auto';
  else if (columns === 'responsive') gridClass += ' grid--responsive';
  
  if (className) gridClass += ` ${className}`;

  return (
    <div className={gridClass}>
      {children}
    </div>
  );
};

export const EmojiButton = ({ emoji, label, isSelected, onClick, className = '' }) => {
  return (
    <button
      className={`emoji ${isSelected ? 'emoji--selected' : ''} ${className}`}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {emoji}
    </button>
  );
};
