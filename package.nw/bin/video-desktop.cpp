// video-desktop.cpp : 此文件包含 "main" 函数。程序执行将在此处开始并结束。
#include <iostream>
#include <Windows.h>

static HWND s_hProgmanWnd = nullptr;
static HWND s_hWorkerWnd = nullptr;

BOOL CALLBACK EnumWindowProcFindDesktopWindow(HWND hTop, LPARAM lparam)
{
    // 查找 SHELLDLL_DefView 窗体句柄
    // 存在多个WorkerW窗体，只有底下存在SHELLDLL_DefView的才是
    HWND hWndShl = ::FindWindowExW(
        hTop, nullptr, L"SHELLDLL_DefView", nullptr);
    if (hWndShl == nullptr) { return true; }

    // win7或更高版本
    // 查找 WorkerW 窗口句柄(以桌面窗口为父窗口)
    s_hWorkerWnd = ::FindWindowExW(nullptr, hTop, L"WorkerW", nullptr);
    return s_hWorkerWnd == nullptr;
}

int findWallPaperLayerWIndow() {
    int ret = 0;
    if (s_hProgmanWnd == nullptr) {
        s_hProgmanWnd = FindWindowExW(GetDesktopWindow(), nullptr, L"Progman", L"Program Manager");
        if (s_hProgmanWnd == nullptr) {
            return ret;
        }
        // 发送消息到Program Manager窗口
        // 要在桌面图标和壁纸之间触发创建WorkerW窗口，必须向Program Manager发送一个消息
        ::SendMessage(s_hProgmanWnd, 0x052C, 0xD, 0);
        ::SendMessage(s_hProgmanWnd, 0x052C, 0xD, 1);
        // 查找到 WorkerW 窗口，设置显示
        EnumWindows(EnumWindowProcFindDesktopWindow, 0);
        // ::ShowWindowAsync(s_hWorkerWnd, SW_HIDE);
        ::ShowWindow(s_hWorkerWnd, SW_NORMAL);

    }
    return ret;
}


int main(int argc,char *argv[])
{
    std::string cs = argv[1];
    // 获取桌面worker层句柄
    if (cs == "getWorker") {
        findWallPaperLayerWIndow();
        std::cout << (int)s_hWorkerWnd;
    }
    // 获取窗口句柄
    else if (cs == "getWindow") {
        LPCSTR title = (LPCSTR)argv[2];
        //std::cout << FindWindowExW(nullptr, nullptr, nullptr, title) << std::endl;
        std::cout << (int)FindWindowA(nullptr,title);
    }
    // 设置父窗口
    else if (cs == "setParent") {
        int child = atoi(argv[2]);
        int parent = atoi(argv[3]);
        std::cout << ::SetParent((HWND)child, (HWND)parent);
    }
    // 设置窗口显示方式
    else if (cs == "showWindow") {        
        int child = atoi(argv[2]);
        int cmdshow = atoi(argv[3]);
        std::cout << ::ShowWindow((HWND)child, cmdshow);
    }
    // 发送消息给某个窗口
    else if (cs == "sendMessage") {
        int hwnd = atoi(argv[2]);
        int msg = atoi(argv[3]);
        int wParam = atoi(argv[4]);
        int lParam = atoi(argv[5]);
        std::cout << ::SendMessageW((HWND)hwnd, msg, wParam, lParam);
    }
    // 销毁窗口
    else if (cs == "destory") {
        int hwnd = atoi(argv[2]);
        std::cout << ::DestroyWindow((HWND)hwnd);
    }
    return 0;
}