(function () {
  'use strict';

  // --- State ---
  var state = {
    count: 0,
    history: []   // max 10 entries, newest-first
  };

  // --- DOM refs ---
  var countEl   = document.getElementById('countDisplay');
  var historyEl = document.getElementById('historyList');

  // --- Render ---
  function renderHistory() {
    historyEl.innerHTML = state.history.map(function (entry) {
      return '<li>' + entry.time + ' \u2014 ' + entry.action + ' \u2192 ' + entry.count + '</li>';
    }).join('');
  }

  function render() {
    countEl.textContent = state.count;
    countEl.className = state.count < 0 ? 'count count--negative' : 'count';
    renderHistory();
  }

  // --- Initialization ---
  render();

})();
