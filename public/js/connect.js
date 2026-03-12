/**
 * Gray Rock - Connect page web-to-lead form
 * Submits lead data to Salesforce Data Cloud SDX via orgGrayRockSalesforce.sendWebToLead.
 */
(function() {
  function init() {
    var form = document.getElementById('connectForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      submitLead(form);
    });
  }

  function submitLead(form) {
    var data = {
      firstName: (form.querySelector('#firstName') || {}).value || '',
      lastName: (form.querySelector('#lastName') || {}).value || '',
      email: (form.querySelector('#email') || {}).value || '',
      company: (form.querySelector('#company') || {}).value || '',
      phone: (form.querySelector('#phone') || {}).value || '',
      message: (form.querySelector('#message') || {}).value || ''
    };

    if (!data.email) return;

    if (window.orgGrayRockSalesforce && typeof window.orgGrayRockSalesforce.sendWebToLead === 'function') {
      window.orgGrayRockSalesforce.sendWebToLead(data);
    }

    showSuccess(form);
  }

  function showSuccess(form) {
    form.style.display = 'none';
    var success = document.getElementById('connectSuccess');
    if (success) success.style.display = 'block';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
