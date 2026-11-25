#define UNICODE
#define _UNICODE
#include <winsock2.h>
#include <windows.h>
#include <ws2tcpip.h>
#include <wininet.h>
#include <shlobj.h>
#include <stdio.h>
#include <stdbool.h>

#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "advapi32.lib")

#define DEFAULT_PORT 3000
#define MUTEX_NAME L"Local\\SmartLedger_Accounting_App_Mutex"
#define APP_TITLE L"Smart Ledger - المحاسب الذكي"

// Utility: Get directory containing this executable
void GetApplicationDirectory(wchar_t* outPath, size_t maxLen) {
    GetModuleFileNameW(NULL, outPath, (DWORD)maxLen);
    wchar_t* lastSlash = wcsrchr(outPath, L'\\');
    if (lastSlash) {
        *lastSlash = L'\0';
    }
}

// Check if a file exists on disk
bool FileExists(const wchar_t* path) {
    if (!path || wcslen(path) == 0) return false;
    DWORD attribs = GetFileAttributesW(path);
    return (attribs != INVALID_FILE_ATTRIBUTES && !(attribs & FILE_ATTRIBUTE_DIRECTORY));
}

// Read registry string
bool ReadRegistryString(HKEY rootKey, const wchar_t* subKey, const wchar_t* valueName, wchar_t* outBuf, DWORD maxLen) {
    HKEY hKey;
    if (RegOpenKeyExW(rootKey, subKey, 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        DWORD type = 0;
        DWORD size = maxLen * sizeof(wchar_t);
        if (RegQueryValueExW(hKey, valueName, NULL, &type, (LPBYTE)outBuf, &size) == ERROR_SUCCESS) {
            RegCloseKey(hKey);
            return true;
        }
        RegCloseKey(hKey);
    }
    return false;
}

// Check if a port is currently listening
bool IsPortInUse(int port) {
    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) {
        return false;
    }

    SOCKET s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (s == INVALID_SOCKET) {
        WSACleanup();
        return false;
    }

    struct sockaddr_in client;
    client.sin_family = AF_INET;
    client.sin_port = htons((u_short)port);
    client.sin_addr.s_addr = inet_addr("127.0.0.1");

    DWORD timeout = 400;
    setsockopt(s, SOL_SOCKET, SO_RCVTIMEO, (char*)&timeout, sizeof(timeout));
    setsockopt(s, SOL_SOCKET, SO_SNDTIMEO, (char*)&timeout, sizeof(timeout));

    int res = connect(s, (struct sockaddr*)&client, sizeof(client));
    closesocket(s);
    WSACleanup();

    return (res == 0);
}

// Ensure user data directory exists and return the path
bool GetUserDataDirectory(wchar_t* outDir, size_t maxLen) {
    wchar_t appData[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, appData)) ||
        SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_APPDATA, NULL, 0, appData))) {
        swprintf(outDir, maxLen, L"%s\\SmartLedger", appData);
        CreateDirectoryW(outDir, NULL);
        return true;
    }
    return false;
}

// Ensure %LOCALAPPDATA%\SmartLedger\data directory exists
void EnsureUserDataDirectory() {
    wchar_t smartLedgerDir[MAX_PATH];
    if (GetUserDataDirectory(smartLedgerDir, MAX_PATH)) {
        wchar_t dataDir[MAX_PATH];
        swprintf(dataDir, MAX_PATH, L"%s\\data", smartLedgerDir);
        CreateDirectoryW(dataDir, NULL);

        wchar_t backupsDir[MAX_PATH];
        swprintf(backupsDir, MAX_PATH, L"%s\\data\\backups", smartLedgerDir);
        CreateDirectoryW(backupsDir, NULL);

        SetEnvironmentVariableW(L"SMART_LEDGER_DATA_DIR", dataDir);
    }
}

// Terminate stale Smart Ledger node instances
void KillStaleSmartLedgerInstances() {
    system("powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \"Get-CimInstance Win32_Process -Filter \\\"Name = 'node.exe'\\\" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*server.cjs*' -or $_.ExecutablePath -like '*SmartLedger*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }\" 2>NUL");
}

// Find browser executable for standalone application window mode (Edge, Chrome, Brave)
bool FindBrowserExecutable(wchar_t* outPath, size_t maxLen) {
    const wchar_t* fixedPaths[] = {
        L"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        L"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        L"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        L"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        L"C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
    };

    for (size_t i = 0; i < sizeof(fixedPaths) / sizeof(fixedPaths[0]); i++) {
        if (FileExists(fixedPaths[i])) {
            wcsncpy(outPath, fixedPaths[i], maxLen);
            return true;
        }
    }

    wchar_t localAppData[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, localAppData))) {
        const wchar_t* userRelative[] = {
            L"\\Microsoft\\Edge\\Application\\msedge.exe",
            L"\\Google\\Chrome\\Application\\chrome.exe",
            L"\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
        };
        for (size_t i = 0; i < sizeof(userRelative) / sizeof(userRelative[0]); i++) {
            swprintf(outPath, maxLen, L"%s%s", localAppData, userRelative[i]);
            if (FileExists(outPath)) {
                return true;
            }
        }
    }

    return false;
}

// Check if Smart Ledger health endpoint responds with 200 OK AND root returns 200
bool CheckHealthEndpoint(int port) {
    wchar_t healthUrl[128];
    swprintf(healthUrl, 128, L"http://127.0.0.1:%d/api/health", port);

    HINTERNET hInternet = InternetOpenW(L"SmartLedgerLauncher/1.0", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hInternet) return false;

    DWORD flags = INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE | INTERNET_FLAG_NO_AUTO_REDIRECT;
    HINTERNET hUrl = InternetOpenUrlW(hInternet, healthUrl, NULL, 0, flags, 0);
    if (!hUrl) {
        InternetCloseHandle(hInternet);
        return false;
    }

    DWORD statusCode = 0;
    DWORD size = sizeof(statusCode);
    bool ok = false;
    if (HttpQueryInfoW(hUrl, HTTP_QUERY_STATUS_CODE | HTTP_QUERY_FLAG_NUMBER, &statusCode, &size, NULL)) {
        if (statusCode == 200) {
            char buffer[512];
            DWORD bytesRead = 0;
            if (InternetReadFile(hUrl, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0) {
                buffer[bytesRead] = '\0';
                if (strstr(buffer, "Smart Ledger") != NULL) {
                    ok = true;
                }
            }
        }
    }
    InternetCloseHandle(hUrl);

    // Verify root URL / does NOT return 404
    if (ok) {
        wchar_t rootUrl[128];
        swprintf(rootUrl, 128, L"http://127.0.0.1:%d/", port);
        hUrl = InternetOpenUrlW(hInternet, rootUrl, NULL, 0, flags, 0);
        if (hUrl) {
            statusCode = 0;
            size = sizeof(statusCode);
            if (HttpQueryInfoW(hUrl, HTTP_QUERY_STATUS_CODE | HTTP_QUERY_FLAG_NUMBER, &statusCode, &size, NULL)) {
                if (statusCode != 200) {
                    ok = false;
                }
            } else {
                ok = false;
            }
            InternetCloseHandle(hUrl);
        } else {
            ok = false;
        }
    }

    InternetCloseHandle(hInternet);
    return ok;
}

// Find Node.js executable anywhere on the system
bool FindNodeExecutable(const wchar_t* appDir, wchar_t* outNodeExe, size_t maxLen) {
    // 1. In appDir/runtime/node.exe
    swprintf(outNodeExe, maxLen, L"%s\\runtime\\node.exe", appDir);
    if (FileExists(outNodeExe)) return true;

    // 2. In appDir/bin/node.exe
    swprintf(outNodeExe, maxLen, L"%s\\bin\\node.exe", appDir);
    if (FileExists(outNodeExe)) return true;

    // 3. In appDir/node.exe
    swprintf(outNodeExe, maxLen, L"%s\\node.exe", appDir);
    if (FileExists(outNodeExe)) return true;

    // 4. Registry install location
    wchar_t regInstall[MAX_PATH];
    if (ReadRegistryString(HKEY_LOCAL_MACHINE, L"Software\\SmartLedger", L"InstallLocation", regInstall, MAX_PATH) ||
        ReadRegistryString(HKEY_CURRENT_USER, L"Software\\SmartLedger", L"InstallLocation", regInstall, MAX_PATH) ||
        ReadRegistryString(HKEY_LOCAL_MACHINE, L"Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\SmartLedger.exe", L"InstallLocation", regInstall, MAX_PATH) ||
        ReadRegistryString(HKEY_CURRENT_USER, L"Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\SmartLedger.exe", L"InstallLocation", regInstall, MAX_PATH)) {
        swprintf(outNodeExe, maxLen, L"%s\\runtime\\node.exe", regInstall);
        if (FileExists(outNodeExe)) return true;
        swprintf(outNodeExe, maxLen, L"%s\\node.exe", regInstall);
        if (FileExists(outNodeExe)) return true;
    }

    // 5. Standard Program Files installation path
    const wchar_t* standardPaths[] = {
        L"C:\\Program Files\\Smart Ledger\\runtime\\node.exe",
        L"C:\\Program Files (x86)\\Smart Ledger\\runtime\\node.exe",
        L"C:\\Program Files\\nodejs\\node.exe",
        L"C:\\Program Files (x86)\\nodejs\\node.exe"
    };
    for (size_t i = 0; i < sizeof(standardPaths) / sizeof(standardPaths[0]); i++) {
        if (FileExists(standardPaths[i])) {
            wcsncpy(outNodeExe, standardPaths[i], maxLen);
            return true;
        }
    }

    // 6. User Local AppData paths
    wchar_t localAppData[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, localAppData))) {
        swprintf(outNodeExe, maxLen, L"%s\\Programs\\nodejs\\node.exe", localAppData);
        if (FileExists(outNodeExe)) return true;
        swprintf(outNodeExe, maxLen, L"%s\\Programs\\SmartLedger\\runtime\\node.exe", localAppData);
        if (FileExists(outNodeExe)) return true;
    }

    // 7. System PATH search
    if (SearchPathW(NULL, L"node.exe", NULL, (DWORD)maxLen, outNodeExe, NULL) > 0) {
        if (FileExists(outNodeExe)) return true;
    }

    return false;
}

// Get last write time of a file for version comparison
bool GetFileLastWriteTime(const wchar_t* path, FILETIME* outFt) {
    WIN32_FILE_ATTRIBUTE_DATA fad;
    if (GetFileAttributesExW(path, GetFileExInfoStandard, &fad)) {
        *outFt = fad.ftLastWriteTime;
        return true;
    }
    return false;
}

// Find server.cjs script file and associated working directory (prefers newer user-space update if present)
bool FindServerScript(const wchar_t* appDir, wchar_t* outScript, wchar_t* outWorkDir, size_t maxLen) {
    wchar_t baseScript[MAX_PATH] = {0};
    wchar_t baseWorkDir[MAX_PATH] = {0};
    bool hasBase = false;

    // 1. appDir/server.cjs
    swprintf(baseScript, MAX_PATH, L"%s\\server.cjs", appDir);
    if (FileExists(baseScript)) {
        wcsncpy(baseWorkDir, appDir, MAX_PATH);
        hasBase = true;
    }

    // 2. appDir/dist/server.cjs
    if (!hasBase) {
        swprintf(baseScript, MAX_PATH, L"%s\\dist\\server.cjs", appDir);
        if (FileExists(baseScript)) {
            wcsncpy(baseWorkDir, appDir, MAX_PATH);
            hasBase = true;
        }
    }

    // 3. Registry install location
    if (!hasBase) {
        wchar_t regInstall[MAX_PATH];
        if (ReadRegistryString(HKEY_LOCAL_MACHINE, L"Software\\SmartLedger", L"InstallLocation", regInstall, MAX_PATH) ||
            ReadRegistryString(HKEY_CURRENT_USER, L"Software\\SmartLedger", L"InstallLocation", regInstall, MAX_PATH) ||
            ReadRegistryString(HKEY_LOCAL_MACHINE, L"Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\SmartLedger.exe", L"InstallLocation", regInstall, MAX_PATH) ||
            ReadRegistryString(HKEY_CURRENT_USER, L"Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\SmartLedger.exe", L"InstallLocation", regInstall, MAX_PATH)) {
            swprintf(baseScript, MAX_PATH, L"%s\\server.cjs", regInstall);
            if (FileExists(baseScript)) {
                wcsncpy(baseWorkDir, regInstall, MAX_PATH);
                hasBase = true;
            } else {
                swprintf(baseScript, MAX_PATH, L"%s\\dist\\server.cjs", regInstall);
                if (FileExists(baseScript)) {
                    wcsncpy(baseWorkDir, regInstall, MAX_PATH);
                    hasBase = true;
                }
            }
        }
    }

    // 4. appDir/.. parent folder
    if (!hasBase) {
        swprintf(baseScript, MAX_PATH, L"%s\\..\\server.cjs", appDir);
        if (FileExists(baseScript)) {
            swprintf(baseWorkDir, MAX_PATH, L"%s\\..", appDir);
            hasBase = true;
        }
    }

    // 5. Standard Program Files installation path
    if (!hasBase) {
        const wchar_t* stdServers[] = {
            L"C:\\Program Files\\Smart Ledger\\server.cjs",
            L"C:\\Program Files (x86)\\Smart Ledger\\server.cjs"
        };
        for (size_t i = 0; i < sizeof(stdServers) / sizeof(stdServers[0]); i++) {
            if (FileExists(stdServers[i])) {
                wcsncpy(baseScript, stdServers[i], MAX_PATH);
                wcsncpy(baseWorkDir, (i == 0) ? L"C:\\Program Files\\Smart Ledger" : L"C:\\Program Files (x86)\\Smart Ledger", MAX_PATH);
                hasBase = true;
                break;
            }
        }
    }

    // 6. Check user-space update override (%LOCALAPPDATA%\SmartLedger\server.cjs)
    wchar_t userDir[MAX_PATH];
    if (GetUserDataDirectory(userDir, MAX_PATH)) {
        wchar_t userScript[MAX_PATH];
        swprintf(userScript, MAX_PATH, L"%s\\server.cjs", userDir);
        if (FileExists(userScript)) {
            if (!hasBase) {
                wcsncpy(outScript, userScript, maxLen);
                wcsncpy(outWorkDir, userDir, maxLen);
                return true;
            }
            FILETIME ftBase, ftUser;
            if (GetFileLastWriteTime(baseScript, &ftBase) && GetFileLastWriteTime(userScript, &ftUser)) {
                if (CompareFileTime(&ftUser, &ftBase) > 0) {
                    wcsncpy(outScript, userScript, maxLen);
                    wcsncpy(outWorkDir, userDir, maxLen);
                    return true;
                }
            }
        }
    }

    if (hasBase) {
        wcsncpy(outScript, baseScript, maxLen);
        wcsncpy(outWorkDir, baseWorkDir, maxLen);
        return true;
    }

    return false;
}

// Find Smart-Ledger-Setup.exe to offer automatic installation
bool FindSetupInstaller(const wchar_t* appDir, wchar_t* outSetup, size_t maxLen) {
    // 1. In appDir
    swprintf(outSetup, maxLen, L"%s\\Smart-Ledger-Setup.exe", appDir);
    if (FileExists(outSetup)) return true;

    // 2. In appDir/dist
    swprintf(outSetup, maxLen, L"%s\\dist\\Smart-Ledger-Setup.exe", appDir);
    if (FileExists(outSetup)) return true;

    // 3. In appDir/..
    swprintf(outSetup, maxLen, L"%s\\..\\Smart-Ledger-Setup.exe", appDir);
    if (FileExists(outSetup)) return true;

    // 4. In Downloads folder
    wchar_t userProfile[MAX_PATH];
    if (GetEnvironmentVariableW(L"USERPROFILE", userProfile, MAX_PATH) > 0) {
        swprintf(outSetup, maxLen, L"%s\\Downloads\\Smart-Ledger-Setup.exe", userProfile);
        if (FileExists(outSetup)) return true;
    }

    return false;
}

// Read active port recorded by server if available
int GetActivePort(int fallbackPort) {
    wchar_t appData[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_APPDATA, NULL, 0, appData))) {
        wchar_t portFile[MAX_PATH];
        swprintf(portFile, MAX_PATH, L"%s\\SmartLedger\\active_port.txt", appData);
        FILE* f = _wfopen(portFile, L"r");
        if (f) {
            int p = 0;
            if (fscanf(f, "%d", &p) == 1 && p > 0 && p < 65535) {
                fclose(f);
                if (CheckHealthEndpoint(p)) return p;
            }
            fclose(f);
        }
    }
    if (CheckHealthEndpoint(fallbackPort)) return fallbackPort;
    return fallbackPort;
}

// Launch browser / app window pointing to the given port
bool OpenApplicationWindow(int port, PROCESS_INFORMATION* pEdgePi) {
    wchar_t browserPath[MAX_PATH];
    wchar_t defaultUrl[128];
    swprintf(defaultUrl, 128, L"http://127.0.0.1:%d", port);

    if (FindBrowserExecutable(browserPath, MAX_PATH)) {
        wchar_t cmdLine[MAX_PATH * 2];
        swprintf(cmdLine, sizeof(cmdLine) / sizeof(wchar_t),
                 L"\"%s\" --new-window --app=http://127.0.0.1:%d --start-maximized",
                 browserPath, port);

        STARTUPINFOW si;
        ZeroMemory(&si, sizeof(si));
        si.cb = sizeof(si);
        si.dwFlags = STARTF_USESHOWWINDOW;
        si.wShowWindow = SW_MAXIMIZE;
        ZeroMemory(pEdgePi, sizeof(PROCESS_INFORMATION));

        if (CreateProcessW(NULL, cmdLine, NULL, NULL, FALSE, 0, NULL, NULL, &si, pEdgePi)) {
            DWORD waitRes = WaitForSingleObject(pEdgePi->hProcess, 350);
            if (waitRes == WAIT_OBJECT_0) {
                DWORD exitCode = 0;
                GetExitCodeProcess(pEdgePi->hProcess, &exitCode);
                if (exitCode != 0) {
                    ShellExecuteW(NULL, L"open", defaultUrl, NULL, NULL, SW_MAXIMIZE);
                }
            }
            return true;
        }
    }

    HINSTANCE hResult = ShellExecuteW(NULL, L"open", defaultUrl, NULL, NULL, SW_MAXIMIZE);
    return ((INT_PTR)hResult > 32);
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // 1. Check for command-line arguments (e.g., --stop)
    if (lpCmdLine && (strstr(lpCmdLine, "--stop") || strstr(lpCmdLine, "/stop") || strstr(lpCmdLine, "-stop"))) {
        KillStaleSmartLedgerInstances();
        system("taskkill /F /IM SmartLedger.exe 2>NUL");
        MessageBoxW(NULL, L"تم إيقاف خادم المحاسب الذكي بنجاح.", APP_TITLE, MB_OK | MB_ICONINFORMATION);
        return 0;
    }

    // 2. Prevent duplicate launcher instances
    HANDLE hMutex = CreateMutexW(NULL, TRUE, MUTEX_NAME);
    if (GetLastError() == ERROR_ALREADY_EXISTS) {
        PROCESS_INFORMATION dummyPi;
        int activePort = GetActivePort(DEFAULT_PORT);
        OpenApplicationWindow(activePort, &dummyPi);
        if (hMutex) CloseHandle(hMutex);
        return 0;
    }

    // 3. Prepare Environment & Paths
    wchar_t appDir[MAX_PATH];
    GetApplicationDirectory(appDir, MAX_PATH);
    EnsureUserDataDirectory();

    // Determine path to node runtime
    wchar_t nodeExe[MAX_PATH];
    bool hasNode = FindNodeExecutable(appDir, nodeExe, MAX_PATH);

    // Determine path to server.cjs
    wchar_t serverScript[MAX_PATH];
    wchar_t workDir[MAX_PATH];
    bool hasScript = FindServerScript(appDir, serverScript, workDir, MAX_PATH);

    // If Node or Server script is missing, guide the user to the installer
    if (!hasNode || !hasScript) {
        wchar_t setupExe[MAX_PATH];
        bool hasSetup = FindSetupInstaller(appDir, setupExe, MAX_PATH);

        if (hasSetup) {
            int res = MessageBoxW(NULL,
                L"تنبيه: محرك التشغيل أو ملفات النظام غير مكتملة في هذا المجلد.\n\n"
                L"تم العثور على معالج التثبيت المعتمد: Smart-Ledger-Setup.exe\n\n"
                L"هل ترغب في تشغيل معالج التثبيت الآن لتثبيت البرنامج بالكامل؟",
                APP_TITLE,
                MB_YESNO | MB_ICONQUESTION);
            if (res == IDYES) {
                ShellExecuteW(NULL, L"open", setupExe, NULL, NULL, SW_SHOWNORMAL);
            }
        } else {
            MessageBoxW(NULL,
                L"تنبيه: محرك تشغيل البرنامج (Node Runtime) غير موجود في هذا المجلد.\n\n"
                L"يرجى تشغيل معالج التثبيت المعتمد:\n"
                L"Smart-Ledger-Setup.exe\n\n"
                L"سيقوم معالج التثبيت بتثبيت كافة مكونات المحاسب الذكي ومحرك التشغيل تلقائياً على جهازك.",
                APP_TITLE,
                MB_OK | MB_ICONEXCLAMATION);
        }

        if (hMutex) CloseHandle(hMutex);
        return 1;
    }

    // 4. Intelligent Port Selection & Automatic Conflict Resolution
    int targetPort = DEFAULT_PORT;
    bool backendAlreadyRunning = false;

    if (IsPortInUse(targetPort)) {
        if (CheckHealthEndpoint(targetPort)) {
            backendAlreadyRunning = true;
        } else {
            KillStaleSmartLedgerInstances();
            Sleep(500);

            if (IsPortInUse(targetPort)) {
                if (CheckHealthEndpoint(targetPort)) {
                    backendAlreadyRunning = true;
                } else {
                    int candidatePorts[] = { 3001, 3002, 3003, 3004, 3005, 3699, 8085 };
                    bool foundFree = false;
                    for (size_t i = 0; i < sizeof(candidatePorts) / sizeof(candidatePorts[0]); i++) {
                        int p = candidatePorts[i];
                        if (!IsPortInUse(p)) {
                            targetPort = p;
                            foundFree = true;
                            break;
                        } else if (CheckHealthEndpoint(p)) {
                            targetPort = p;
                            backendAlreadyRunning = true;
                            foundFree = true;
                            break;
                        }
                    }
                    if (!foundFree) {
                        targetPort = 3699;
                    }
                }
            }
        }
    }

    PROCESS_INFORMATION piServer;
    ZeroMemory(&piServer, sizeof(piServer));

    // 5. Start Backend Process (Hidden & Silent) if not already running
    if (!backendAlreadyRunning) {
        wchar_t cmdLine[MAX_PATH * 3];
        swprintf(cmdLine, sizeof(cmdLine) / sizeof(wchar_t), L"\"%s\" \"%s\"", nodeExe, serverScript);

        STARTUPINFOW siServer;
        ZeroMemory(&siServer, sizeof(siServer));
        siServer.cb = sizeof(siServer);
        siServer.dwFlags = STARTF_USESHOWWINDOW;
        siServer.wShowWindow = SW_HIDE;

        wchar_t portStr[16];
        swprintf(portStr, 16, L"%d", targetPort);
        SetEnvironmentVariableW(L"NODE_ENV", L"production");
        SetEnvironmentVariableW(L"PORT", portStr);

        // Prepare user directory for server logs and writable data
        wchar_t userDir[MAX_PATH];
        if (!GetUserDataDirectory(userDir, MAX_PATH)) {
            wcsncpy(userDir, workDir, MAX_PATH);
        }

        // Prepare server log file for stdout/stderr redirection to prevent EBADF crashes and capture diagnostics
        SECURITY_ATTRIBUTES sa;
        sa.nLength = sizeof(sa);
        sa.bInheritHandle = TRUE;
        sa.lpSecurityDescriptor = NULL;

        wchar_t logPath[MAX_PATH];
        swprintf(logPath, MAX_PATH, L"%s\\server_startup.log", userDir);

        HANDLE hLog = CreateFileW(
            logPath,
            GENERIC_WRITE,
            FILE_SHARE_READ | FILE_SHARE_WRITE,
            &sa,
            CREATE_ALWAYS,
            FILE_ATTRIBUTE_NORMAL,
            NULL
        );

        if (hLog != INVALID_HANDLE_VALUE) {
            siServer.dwFlags |= STARTF_USESTDHANDLES;
            siServer.hStdOutput = hLog;
            siServer.hStdError = hLog;
        }

        BOOL bCreated = CreateProcessW(
            nodeExe,
            cmdLine,
            NULL,
            NULL,
            TRUE,
            CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP,
            NULL,
            userDir,
            &siServer,
            &piServer
        );

        if (!bCreated) {
            // Fallback 1: try with lpApplicationName as NULL
            bCreated = CreateProcessW(
                NULL,
                cmdLine,
                NULL,
                NULL,
                TRUE,
                CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP,
                NULL,
                userDir,
                &siServer,
                &piServer
            );
        }

        if (!bCreated) {
            // Fallback 2: try with current directory NULL
            bCreated = CreateProcessW(
                nodeExe,
                cmdLine,
                NULL,
                NULL,
                TRUE,
                CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP,
                NULL,
                NULL,
                &siServer,
                &piServer
            );
        }

        if (hLog != INVALID_HANDLE_VALUE) {
            CloseHandle(hLog);
        }

        if (!bCreated) {
            wchar_t errorMsg[1024];
            swprintf(errorMsg, 1024,
                     L"فشل في بدء تشغيل خادم المحاسب الذكي.\n"
                     L"رمز الخطأ: %lu\n\n"
                     L"المسارات المستخدمة:\n"
                     L"- محرك التشغيل: %s [%s]\n"
                     L"- ملف الخادم: %s [%s]\n"
                     L"- مجلد العمل: %s\n\n"
                     L"يرجى تشغيل أحدث ملف تثبيت Smart-Ledger-Setup.exe الذي تم إنشاؤه لإعادة ضبط كافة الملفات.",
                     GetLastError(),
                     nodeExe, FileExists(nodeExe) ? L"موجود" : L"غير موجود",
                     serverScript, FileExists(serverScript) ? L"موجود" : L"غير موجود",
                     workDir);
            MessageBoxW(NULL, errorMsg, APP_TITLE, MB_OK | MB_ICONERROR);
            if (hMutex) CloseHandle(hMutex);
            return 1;
        }

        // Wait for server to bind port and become responsive (up to 15 seconds)
        bool serverReady = false;
        for (int i = 0; i < 60; i++) {
            Sleep(250);

            // Check if server process exited prematurely
            DWORD exitCode = 0;
            if (GetExitCodeProcess(piServer.hProcess, &exitCode) && exitCode != STILL_ACTIVE) {
                wchar_t logSnippet[512] = {0};
                FILE* lf = _wfopen(logPath, L"r");
                if (lf) {
                    char rawBuf[500] = {0};
                    size_t readBytes = fread(rawBuf, 1, sizeof(rawBuf) - 1, lf);
                    fclose(lf);
                    if (readBytes > 0) {
                        MultiByteToWideChar(CP_UTF8, 0, rawBuf, (int)readBytes, logSnippet, 510);
                    }
                }

                wchar_t failMsg[1024];
                if (wcslen(logSnippet) > 0) {
                    swprintf(failMsg, 1024,
                             L"توقف محرك المحاسب الذكي عن العمل بشكل غير متوقع (رمز الخطأ: %lu).\n\n"
                             L"تفاصيل السجل:\n%s\n\n"
                             L"يرجى إعادة تشغيل معالج التثبيت Smart-Ledger-Setup.exe لإعادة ضبط الملفات.",
                             exitCode, logSnippet);
                } else {
                    swprintf(failMsg, 1024,
                             L"توقف محرك المحاسب الذكي عن العمل بشكل غير متوقع (رمز الخطأ: %lu).\n\n"
                             L"يرجى إعادة تشغيل معالج التثبيت Smart-Ledger-Setup.exe لإعادة ضبط الملفات.",
                             exitCode);
                }
                MessageBoxW(NULL, failMsg, APP_TITLE, MB_OK | MB_ICONERROR);
                if (hMutex) CloseHandle(hMutex);
                return 1;
            }

            int ap = GetActivePort(targetPort);
            if (CheckHealthEndpoint(ap)) {
                targetPort = ap;
                serverReady = true;
                break;
            }
        }

        // Additional small grace period to allow full frontend asset readiness
        if (serverReady) {
            Sleep(150);
        }
    }

    // 6. Launch Frontend Window directly to targetPort
    PROCESS_INFORMATION piEdge;
    ZeroMemory(&piEdge, sizeof(piEdge));
    int finalPort = GetActivePort(targetPort);
    OpenApplicationWindow(finalPort, &piEdge);

    if (piEdge.hProcess != NULL) {
        CloseHandle(piEdge.hProcess);
        CloseHandle(piEdge.hThread);
    }

    if (piServer.hProcess != NULL) {
        CloseHandle(piServer.hProcess);
        CloseHandle(piServer.hThread);
    }

    if (hMutex) {
        ReleaseMutex(hMutex);
        CloseHandle(hMutex);
    }

    return 0;
}
