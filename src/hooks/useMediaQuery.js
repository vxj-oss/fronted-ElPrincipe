import { useSyncExternalStore } from 'react';

export function useMediaQuery(query) {
  const subscribe = (callback) => {
    if (typeof window === 'undefined') return () => {};
    const mediaQueryList = window.matchMedia(query);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', callback);
    } else {
      mediaQueryList.addListener(callback);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', callback);
      } else {
        mediaQueryList.removeListener(callback);
      }
    };
  };

  const getSnapshot = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useMediaQuery;