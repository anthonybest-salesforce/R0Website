/**
 * Gray Rock - Connect page web-to-lead form
 * Submits lead data to Salesforce Data Cloud SDX as a custom event.
 */
(function() {
  var CUSTOM_EVENT_TYPE = (typeof window.orgGrayRockInteractionNames !== 'undefined' && window.orgGrayRockInteractionNames.lead)
    ? window.orgGrayRockInteractionNames.lead
    : 'webToLead';

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

    if (!data.email) {
      return;
    }

    var SI = window.SalesforceInteractions;
    if (SI && typeof SI.sendEvent === 'function') {
      try {
        SI.sendEvent({
          interaction: {
            name: CUSTOM_EVENT_TYPE,
            eventType: CUSTOM_EVENT_TYPE,
            company: data.company || undefined,
            phone: data.phone || undefined,
            message: data.message || undefined,
            leadSource: 'Gray Rock Website'
          },
          user: {
            identities: { email: data.email },
            attributes: {
              firstName: data.firstName,
              lastName: data.lastName,
              emailAddress: data.email
            }
          }
        });
        console.log('%c[Gray Rock] Salesforce Personalization: sendEvent — webToLead → Data Cloud SDX', 'color: orange; font-weight: 500');
      } catch (err) {
        console.warn('[Gray Rock] sendEvent failed:', err);
      }
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
