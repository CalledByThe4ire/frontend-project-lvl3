// Core
import { path as PROJECT_ROOT } from 'app-root-path';
import { resolve } from 'path';

// Network
export const HOST = 'localhost';
export const PORT = 3000;

// Paths
export { PROJECT_ROOT };
export const SOURCE = resolve(PROJECT_ROOT, './src/');
export const DIST = resolve(PROJECT_ROOT, './dist/');

// Formatting
export const CHUNK_NAME_JS = '[name].[chunkhash].[id].js';
export const CHUNK_NAME_CSS = '[name].[contenthash].[id].css';
