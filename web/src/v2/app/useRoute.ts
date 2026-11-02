import { useEffect, useState } from 'react';
import { parseRoute, routePath } from '../lib/route';
import type { Route } from '../lib/route';

// The v2 route in the address bar: read on load and on Back, written with pushState
// (replaceState for moves that should not each need their own Back, such as arrow keys across tabs).
export function useRoute(): [Route, (next: Route, replace?: boolean) => void] {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (next: Route, replace = false) => {
    const path = routePath(next);
    if (path !== window.location.pathname) window.history[replace ? 'replaceState' : 'pushState'](null, '', path);
    setRoute(next);
  };
  return [route, go];
}
