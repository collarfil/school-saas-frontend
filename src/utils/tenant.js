// src/utils/tenant.js
export const getTenantInfo = () => {
  const hostname = window.location.hostname;
  const domain = import.meta.env.VITE_APP_DOMAIN || 'localhost:8000';
  
  let subdomain = null;
  
  // For local development
  if (domain.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== 'www') {
      subdomain = parts[0];
    }
  } else {
    // For production
    const domainParts = domain.split('.');
    const hostParts = hostname.split('.');
    
    if (hostParts[0] === 'www') {
      hostParts.shift();
    }
    
    if (hostParts.length > domainParts.length) {
      subdomain = hostParts[0];
    }
  }
  
  return { subdomain, hostname, domain };
};