/**
 * Reserved Routes
 * 
 * These slugs cannot be used as usernames/handles because they would
 * conflict with existing application routes.
 */

export const RESERVED_ROUTES = new Set([
  // App routes
  'activity',
  'settings', 
  'setup',
  'configure',
  'deposit',
  'withdraw',
  'documents',
  'help',
  'legal',
  'security',
  'funds',
  'onboarding',
  
  // Auth routes  
  'login',
  'logout',
  'sign-in',
  'sign-up',
  'signin',
  'signup',
  
  // System routes
  'api',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest',
  '_next',
  'static',
  'public',
  
  // Reserved words
  'admin',
  'root',
  'support',
  'yuki',
  'system',
  'wallet',
  'profile',
  'user',
  'users',
  'account',
  'home',
  'dashboard',
  'explore',
  'search',
  'notifications',
  'messages',
  'trending',
  'about',
  'privacy',
  'terms',
  'tos',
]);

/**
 * Check if a handle/username would conflict with reserved routes
 */
export function isReservedRoute(handle: string): boolean {
  const normalized = handle.toLowerCase().replace(/^@/, '');
  return RESERVED_ROUTES.has(normalized);
}

