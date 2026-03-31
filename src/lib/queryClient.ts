import { QueryClient } from '@tanstack/react-query';

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

// TODO: Add MMKV persister for offline support
// import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
// import { MMKV } from 'react-native-mmkv';
// const storage = new MMKV({ id: 'kaly-query-cache' });
// export const persister = createSyncStoragePersister({ storage: mmkvAdapter });
