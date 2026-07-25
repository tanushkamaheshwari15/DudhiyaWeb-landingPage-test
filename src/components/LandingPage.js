import React from 'react';

const LandingPage = () => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100%',
      border: 'none',
      padding: 0,
      margin: 0,
      background: '#fff',
    }}>
      <iframe
        title="Landing Page"
        src="/landing_page/index.html"
        style={{ border: 'none', width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default LandingPage;
