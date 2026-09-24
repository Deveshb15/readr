import NetInfo, { useNetInfo } from '@react-native-community/netinfo';

/** `isInternetReachable` is null while unknown; treat unknown as online so we don't flash "offline". */
export function isOnlineState(state: { isConnected: boolean | null; isInternetReachable: boolean | null }): boolean {
  if (state.isConnected === false) return false;
  return state.isInternetReachable !== false;
}

export function useIsOffline(): boolean {
  const state = useNetInfo();
  return !isOnlineState(state);
}

export function subscribeOnline(listener: (online: boolean) => void): () => void {
  return NetInfo.addEventListener((s) => listener(isOnlineState(s)));
}

export async function isOnlineNow(): Promise<boolean> {
  return isOnlineState(await NetInfo.fetch());
}
