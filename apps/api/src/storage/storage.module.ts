import { Global, Module } from '@nestjs/common';
import { LocalStorageProvider } from './local-storage.provider';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [LocalStorageProvider, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
