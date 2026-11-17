// Preserve Puck's UI styles while using its system-font fallback. The optional
// remote Inter import conflicts with our same-origin stylesheet CSP.
module.exports = function puckCssWithoutRemoteFont(source) {
  return source.replace(/@import\s+["']https:\/\/rsms\.me\/inter\/inter\.css["'];?/g, '');
};
