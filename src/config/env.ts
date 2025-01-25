const isProd = import.meta.env.PROD;
const GITHUB_USERNAME = 'ismailbozkurt';
const GITHUB_REPO = 'ismailbozkurt.github.io';
const GITHUB_BRANCH = 'main';

export const config = {
  isProd,
  contentBaseUrl: isProd 
    ? `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${GITHUB_BRANCH}`
    : '',  // Empty string for local development
  apiBaseUrl: isProd
    ? ''   // Empty string for production (relative paths)
    : 'http://localhost:3000'  // Local development API server
}; 