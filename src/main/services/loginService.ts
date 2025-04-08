import { is } from '@electron-toolkit/utils'
import { exec, execSync } from 'child_process'
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import path from 'path'

let ollamaPath
if (is.dev) {
  ollamaPath = 'D:\\aiwork\\ollama-windows-amd64'
} else {
  if (app.isPackaged == true) {
    ollamaPath = path.join(process.env.PORTABLE_EXECUTABLE_DIR!, 'ollama')
  } else {
    ollamaPath = path.join(__dirname, 'ollama')
  }
}

export class LoginService {
  private static instance: LoginService | null = null
  private successCallback: (resp: any) => void = () => {}
  private isLoginSuccess: boolean = false

  public static getInstance(): LoginService {
    if (!LoginService.instance) {
      LoginService.instance = new LoginService()
    }

    return LoginService.instance
  }

  public initLoginWindow({
    parent,
    windowOptions
  }: {
    parent?: BrowserWindow
    windowOptions?: Electron.BrowserWindowConstructorOptions
  }): BrowserWindow {
    const width = windowOptions?.width || 1000
    const height = windowOptions?.height || 680

    const loginWindow = new BrowserWindow({
      width,
      height,
      autoHideMenuBar: true,
      title: 'Cherry Studio',
      parent,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: false
      }
    })

    const appPath = app.getAppPath()
    const url = `file://${appPath}/resources/login.html`
    loginWindow.loadURL(url)

    // if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    //   loginWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/login.html')
    // } else {
    //   loginWindow.loadFile(join(__dirname, '../renderer/login.html'))
    // }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ipcMain.handle('app:login', async (_, _username: string, _password: string) => {
      // dialog.showMessageBoxSync({
      //   type: 'info',
      //   title: 'Information',
      //   message: 'test out:' + ollamaPath,
      //   buttons: ['OK']
      // });

      const ollamaLoadingUrl = `file://${appPath}/resources/ollamaLoading.html`
      loginWindow.loadURL(ollamaLoadingUrl)

      this.processOllama(loginWindow)
      return {
        success: true
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ipcMain.handle('app:readyInto', async (_) => {
      // dialog.showMessageBoxSync({
      //   type: 'info',
      //   title: 'Information',
      //   message: 'into...',
      //   buttons: ['OK']
      // });

      this.intoMainWindown()
    })

    //loginWindow.loadFile(join(__dirname, uri))
    return loginWindow
  }

  private async processOllama(loginWindow) {
    let trycount = 0
    do {
      if (this.ollamaStarted()) {
        if (this.ollamaCheckDpR1()) {
          this.intoMainWindown()
          return
        }

        this.ollamaUpdateDpR1(loginWindow)
        return
      }

      this.ollamaRun()
      await this.sleep(500)
      trycount++
    } while (trycount <= 2)

    //const cmdRes = execSync('ipconfig');
    //console.log(cmdRes.toString())

    const result = dialog.showMessageBoxSync({
      type: 'warning',
      title: 'Information',
      message: 'ollama未启动,是否继续进入程序!',
      buttons: ['确定', '退出']
    })

    if (result == 0) {
      this.intoMainWindown()
    } else {
      loginWindow.close()
    }
  }

  private intoMainWindown() {
    this.isLoginSuccess = true
    if (this.successCallback != null) {
      this.successCallback({})
    }
  }

  private sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private ollamaStarted(): boolean {
    try {
      const cmdRes = execSync('tasklist | findstr "ollama"')
      const outStr = cmdRes.toString()
      //console.log(outStr)

      if (outStr.includes('ollama')) {
        return true
      }
    } catch (error) {
      console.error(`执行错误: `, error)
    }

    return false
  }

  private ollamaRun() {
    try {
      exec('cmd /c ollama.bat', { cwd: ollamaPath })
    } catch (error) {
      console.error(`run error: `, error)
    }
  }

  private ollamaCheckDpR1() {
    try {
      const cmdRes = execSync('ollama.exe show deepseek-r1:1.5b', { cwd: ollamaPath })
      const outStr = cmdRes.toString()
      //console.log(outStr)

      if (outStr.includes('Error')) {
        return false
      }

      return true
    } catch (error) {
      console.error(`执行错误: `, error)
    }

    return false
  }

  private async ollamaUpdateDpR1(loginWindow) {
    const util = require('util')
    try {
      const execPromise = util.promisify(exec)
      const cmdRes = await execPromise('ollama.exe pull deepseek-r1:1.5b', { cwd: ollamaPath })
      const outStr = cmdRes.toString()
      console.log(outStr)

      loginWindow.webContents.postMessage('event:onReadyIntact', 'finish')

      return true
    } catch (error) {
      console.error(`执行错误: `, error)
    }

    return false
  }

  public onSiccessLogin(listener: (resp: any) => void) {
    this.successCallback = listener
  }

  public isSuccess(): boolean {
    return this.isLoginSuccess
  }
}

export const loginService = LoginService.getInstance()
