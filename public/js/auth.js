(function() {
  const path = window.location.pathname;
  const isAccountPage = path === '/account' || path.endsWith('/account.html') || path === '/account.html';

  // loggedIn is set by account.js when /api/me succeeds, or by signin redirect

  // Update Sign In / My Account / Log Out button in main nav
  const authBtn = document.getElementById('authBtn');
  if (authBtn && localStorage.getItem('loggedIn')) {
    if (isAccountPage) {
      authBtn.textContent = 'Log Out';
      authBtn.href = '#';
      authBtn.addEventListener('click', function(e) {
        e.preventDefault();
        fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(function() {});
        localStorage.removeItem('loggedIn');
        window.location.href = 'index.html';
      });
    } else {
      authBtn.textContent = 'My Account';
      authBtn.href = 'account.html';
    }
  }
})();
