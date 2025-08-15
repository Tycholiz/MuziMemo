// Type declarations for packages without built-in TypeScript support

declare module 'react-native-cloud-storage' {
  export interface WriteFileOptions {
    encoding?: 'utf8' | 'base64'
  }

  export interface ReadFileOptions {
    encoding?: 'utf8' | 'base64'
  }

  export class CloudStorage {
    static writeFile(path: string, content: string, options?: WriteFileOptions): Promise<void>
    static readFile(path: string, options?: ReadFileOptions): Promise<string>
    static exists(path: string): Promise<boolean>
    static deleteFile(path: string): Promise<void>
    static listFiles(path?: string): Promise<string[]>
  }
}

declare module '@react-native-community/netinfo' {
  export interface NetInfoState {
    type: string
    isConnected: boolean | null
    isInternetReachable: boolean | null
    details?: any
  }

  export interface NetInfoSubscription {
    (): void
  }

  export default class NetInfo {
    static fetch(): Promise<NetInfoState>
    static addEventListener(listener: (state: NetInfoState) => void): NetInfoSubscription
    static useNetInfo(): NetInfoState
  }

  export { NetInfoState }
}
