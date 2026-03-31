import { QueryClient } from '@tanstack/react-query';
import { onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

// A8: Sync react-query online status with NetInfo
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes
      gcTime: 1000 * 60 * 60 * 24,     // 24 hours cache
      retry: 2,
    },
    mutations: {
      retry: 1,
    },
  },
});
