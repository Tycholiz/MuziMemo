// Type declarations for packages without built-in TypeScript support

declare module 'react-native-cloud-storage' {
  export interface WriteFileOptions {
    encoding?: 'utf8' | 'base64'
  }

  export interface ReadFileOptions {
    encoding?: 'utf8' | 'base64'
  }

  export enum CloudStorageProvider {
    iCloud = 'iCloud',
    GoogleDrive = 'GoogleDrive'
  }

  export class CloudStorage {
    static writeFile(path: string, content: string, scope: string): Promise<void>
    static uploadFile(remotePath: string, localPath: string, options: { mimeType: string }, scope: string): Promise<void>
    static readFile(path: string, scope: string, options?: ReadFileOptions): Promise<string>
    static exists(path: string, scope: string): Promise<boolean>
    static deleteFile(path: string, scope: string): Promise<void>
    static readdir(path: string, scope: string): Promise<string[]>
    static getProvider(): CloudStorageProvider
    static setProviderOptions(options: any): void
  }

  export function useIsCloudAvailable(): boolean
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
