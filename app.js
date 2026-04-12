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

  // --- Action functions ---
  function addHistory(action, resultingCount) {
    var now = new Date();
    var ts = now.toTimeString().slice(0, 8); // HH:MM:SS
    state.history.unshift({ action: action, count: resultingCount, time: ts });
    if (state.history.length > 10) {
      state.history = state.history.slice(0, 10);
    }
  }

  function increment() {
    state.count += 1;
    addHistory('Increment', state.count);
    render();
  }

  function decrement() {
    state.count -= 1;
    addHistory('Decrement', state.count);
    render();
  }

  function reset() {
    state.count = 0;
    addHistory('Reset', state.count);
    render();
  }

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

  // --- Event listeners ---
  document.querySelector('.btn--increment').addEventListener('click', increment);
  document.querySelector('.btn--decrement').addEventListener('click', decrement);
  document.querySelector('.btn--reset').addEventListener('click', reset);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp')                  { increment(); }
    if (e.key === 'ArrowDown')                { decrement(); }
    if (e.key === 'r' || e.key === 'R')       { reset(); }
  });

  // --- Initialization ---
  render();

})();
