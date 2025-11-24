const { join } = require('path');

/**
 * Puppeteer configuration
 * Move Chrome cache to E drive to save C drive space
 */
module.exports = {
  // Cache directory on E drive
  cacheDirectory: join('E:', 'DevTools', 'puppeteer'),
};
