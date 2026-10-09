import { contextBridge } from 'electron';
import { createApi } from './system-api';

contextBridge.exposeInMainWorld('juwonSystem', Object.freeze(createApi()));
