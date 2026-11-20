(function exposeRewardGuard(root) {
  function claimRewardOnce(state, key, points, award) {
    if (!state || typeof key !== 'string' || !key || typeof award !== 'function') return false;
    if (!state.rewarded || typeof state.rewarded !== 'object' || Array.isArray(state.rewarded)) state.rewarded = {};
    if (state.rewarded[key]) return false;
    state.rewarded[key] = true;
    award(points);
    return true;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { claimRewardOnce };
  else root.claimRewardOnce = claimRewardOnce;
})(typeof globalThis === 'undefined' ? this : globalThis);
