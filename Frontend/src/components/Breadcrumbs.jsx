import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Breadcrumbs.css';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  let breadcrumbPath = '';

  // Do not show breadcrumbs on home, login, or the root products page
  if (location.pathname === '/home' || location.pathname === '/login' || location.pathname === '/') {
    return null;
  }

  return (
    <nav aria-label="breadcrumb" className="breadcrumb-container">
      <ol className="breadcrumb">
        <li className="breadcrumb-item">
          <Link to="/">Products</Link>
        </li>
        {pathnames.map((name, index) => {
          breadcrumbPath += `/${name}`;
          const isLast = index === pathnames.length - 1;

          // Capitalize the first letter and decode URI components
          const displayName = decodeURIComponent(name).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

          return isLast ? (
            <li key={breadcrumbPath} className="breadcrumb-item active" aria-current="page">
              {displayName}
            </li>
          ) : (
            <li key={breadcrumbPath} className="breadcrumb-item">
              <Link to={breadcrumbPath}>{displayName}</Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
