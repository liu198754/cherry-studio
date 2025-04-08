import { is } from '@electron-toolkit/utils'
import { app } from 'electron'
import path from 'path'

if (is.dev) {
  const localPath = path.join(app.getAppPath(), 'appData')
  app.setPath('userData', localPath)
} else {
  if (app.isPackaged == true) {
    const localPath = path.join(process.env.PORTABLE_EXECUTABLE_DIR!, 'appData')
    app.setPath('userData', localPath)
  } else {
    const localPath = path.join(__dirname, 'appData')
    app.setPath('userData', localPath)
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function initPath() {}
