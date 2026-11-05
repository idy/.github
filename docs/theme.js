(() => {
  "use strict";

  // Shared preferences live in shared/idy.js; this file supplies the page content.
  const site = window.IdySite;
  const notFound = document.documentElement.dataset.page === "not-found";
  const translations = {
    en: {
      pageTitle: notFound ? "Page not found — idy.dev" : "Open-source projects — idy.dev",
      pageDescription: notFound
        ? "This page could not be found. Explore the open-source projects at idy.dev."
        : "Open-source projects by idy: GizClaw, GizOS, Nootify, CH348 macOS, TailSplit, TailRelay, WGC, WGC NE, and the Homebrew tap. Explore the projects and their latest releases.",
      heading: "Open-source projects",
      followLabel: "Follow idy on GitHub (opens in a new tab)",
      intro: "Open-source projects for connected devices, macOS, and networking.",
      gizclawDescription: "An agent runtime and edge-server platform for connected devices, with a server, CLI, WebRTC transport, APIs, and SDKs.",
      gizosDescription: "A portable firmware and application platform for embedded devices, desktop, mobile, and WebAssembly, with shared platform abstractions, libraries, and build tooling.",
      nootifyDescription: "Follow Claude Code, Codex, and OpenCode in Feishu, then send replies back to the existing sessions on your Mac. A native menu-bar app with local routing logs and GitHub pull-request queues.",
      setupGuide: "Setup guide", downloadNootify: "macOS Apple Silicon (.dmg)",
      ch348Description: "Native macOS serial ports for WCH CH348 eight-port USB-to-UART adapters, using DriverKit. Communication has been verified on all eight channels; broader compatibility testing is ongoing.",
      tailsplitDescription: "Route traffic by domain and IP with sing-box. Desktop apps and command-line tools use YAML rules for direct connections, proxies, and Tailscale exits.",
      tailrelayDescription: "Runs a Tailscale exit node through a specified SOCKS5 proxy. Each instance keeps its own device identity and configuration, so several exits can share one machine. Supports Linux and macOS.",
      wgcDescription: "A Go library for authenticated, encrypted messages using WireGuard sessions. Authorize peers by public key, bring your own transport, and exchange arbitrary application payloads.",
      wgcNeDescription: "A Flutter plugin and Apple Network Extension SDK built on WGC and sing-box. Use standard UDP or compile your own transport into the native core; each app keeps its own signed tunnel extension.",
      projectPage: "Project page",
      testResults: "Test results",
      goReference: "Go reference",
      integrationGuide: "Integration guide",
      homebrewDescription: "Install Nootify and TailSplit on macOS using my Homebrew tap.",
      homebrewInstall: "Homebrew", homebrewGuide: "Installation guide", homebrewAddTap: "Add the tap",
      homebrewTrust: "Trust the tap (Homebrew 7+)", homebrewInstallApp: "Install an app", homebrewCopy: "Copy",
      homebrewCopyTap: "Copy tap command", homebrewCopyTrust: "Copy trust command",
      homebrewCopyNootify: "Copy Nootify install command", homebrewCopyTailSplit: "Copy TailSplit install command",
      homebrewCopied: "Command copied.", homebrewSelected: "Command selected. Copy it manually.",
      homebrewManual: "Select the command and copy it manually.",
      moreProjects: "More projects on GitHub",
      downloads: "Downloads",
      downloadCH348: "macOS installer (.pkg)",
      downloadTailSplitMac: "macOS Apple Silicon (.dmg)",
      downloadTailSplitWindows: "Windows x64 (.exe)",
      downloadTailRelay: "Linux x64 (.tar.gz)",
      downloadWGC: "Source code (.zip)",
      downloadWGCNE: "Apple SDK (.xcframework.zip)",
      downloadsIncomplete: "Some download links are unavailable for this release. Check its release page for available files.",
      notFoundHeading: "Page not found",
      notFoundDescription: "Check the address, or return to the homepage to explore the projects.",
      backHome: "Back to the homepage",
    },
    zh: {
      pageTitle: notFound ? "页面未找到 — idy.dev" : "开源项目 — idy.dev",
      pageDescription: notFound
        ? "未找到此页面。欢迎浏览 idy.dev 的开源项目。"
        : "idy 的开源项目：GizClaw、GizOS、Nootify、CH348 macOS、TailSplit、TailRelay、WGC、WGC NE 和 Homebrew tap。了解各项目，获取最新版本和下载链接。",
      heading: "开源项目",
      followLabel: "follow — 在 GitHub 关注 idy（在新标签页打开）",
      intro: "面向联网设备、macOS 和网络应用的开源项目。",
      gizclawDescription: "面向联网设备的智能体运行时和边缘服务器平台，提供服务器、命令行工具、WebRTC 传输、API 和 SDK。",
      gizosDescription: "面向嵌入式设备、桌面、移动端和 WebAssembly 的可移植固件与应用平台，提供共享的平台抽象、库和构建工具。",
      nootifyDescription: "在飞书跟进 Claude Code、Codex 与 OpenCode，把回复送回 Mac 上已有的会话。原生菜单栏应用，提供本地路由日志与 GitHub PR 清单。",
      setupGuide: "设置指南", downloadNootify: "macOS Apple 芯片（.dmg）",
      ch348Description: "基于 DriverKit，为 WCH CH348 八通道 USB 转 UART 适配器提供原生 macOS 串口。八个通道均已通过通信验证，更广泛的兼容性测试仍在进行。",
      tailsplitDescription: "基于 sing-box，按域名和 IP 分流流量。提供桌面应用和命令行工具，通过 YAML 规则配置直连、代理和 Tailscale 出口。",
      tailrelayDescription: "通过指定的 SOCKS5 代理运行 Tailscale 出口节点。每个实例使用独立的设备身份和配置，可在一台机器上运行多个出口。支持 Linux 和 macOS。",
      wgcDescription: "使用 WireGuard 会话传输经过认证和加密消息的 Go 库。通过公钥授权对端，自选传输方式，交换任意应用数据。",
      wgcNeDescription: "基于 WGC 和 sing-box 的 Flutter 插件与 Apple Network Extension SDK。可使用标准 UDP，也可将自定义传输编译进原生核心；每个应用使用独立签名的隧道扩展。",
      projectPage: "项目主页",
      testResults: "测试结果",
      goReference: "Go API 文档",
      integrationGuide: "集成指南",
      homebrewDescription: "通过我的 Homebrew tap 在 macOS 上安装 Nootify 和 TailSplit。",
      homebrewInstall: "Homebrew", homebrewGuide: "安装指南", homebrewAddTap: "添加 tap",
      homebrewTrust: "信任 tap（Homebrew 7 及以上）", homebrewInstallApp: "安装应用", homebrewCopy: "复制",
      homebrewCopyTap: "复制添加 tap 命令", homebrewCopyTrust: "复制信任 tap 命令",
      homebrewCopyNootify: "复制 Nootify 安装命令", homebrewCopyTailSplit: "复制 TailSplit 安装命令",
      homebrewCopied: "命令已复制。", homebrewSelected: "命令已选中，请手动复制。",
      homebrewManual: "请选中命令并手动复制。",
      moreProjects: "在 GitHub 查看更多项目",
      downloads: "下载",
      downloadCH348: "macOS 安装包（.pkg）",
      downloadTailSplitMac: "macOS Apple 芯片（.dmg）",
      downloadTailSplitWindows: "Windows x64（.exe）",
      downloadTailRelay: "Linux x64（.tar.gz）",
      downloadWGC: "源代码（.zip）",
      downloadWGCNE: "Apple SDK（.xcframework.zip）",
      downloadsIncomplete: "此版本的部分下载链接暂不可用，请前往发布页面查看可用文件。",
      notFoundHeading: "页面未找到",
      notFoundDescription: "请检查地址，或返回首页浏览项目。",
      backHome: "返回首页",
    },
  };

  const downloads = {
    "GizClaw/gizclaw": [],
    "GizClaw/gizos": [],
    "idy/nootify": [{ label: "downloadNootify", pattern: /^Nootify_.+_(?:aarch64|arm64)\.dmg$/i }],
    "idy/ch348-macos": [{ label: "downloadCH348", pattern: /^CH348-.*-macos-.*\.pkg$/i }],
    "idy/tailsplit": [
      { label: "downloadTailSplitMac", pattern: /^TailSplit_.*_darwin_arm64\.dmg$/i },
      { label: "downloadTailSplitWindows", pattern: /^TailSplit_.*_windows_amd64_setup\.exe$/i },
    ],
    "idy/tailrelay": [{ label: "downloadTailRelay", pattern: /^tailrelay_.*_linux_amd64\.tar\.gz$/i }],
    "idy/wgc": [{ label: "downloadWGC", source: true }],
    "idy/wgc-ne": [{ label: "downloadWGCNE", pattern: /^WGCCore-.*\.xcframework\.zip$/i }],
  };

  const projects = Array.from(document.querySelectorAll("[data-repository]"), element => ({
    element,
    repository: element.dataset.repository,
    fallback: element.querySelector("[data-release-link]").href,
    release: null,
    loading: true,
  }));

  function sourceArchive(release, repository) {
    if (typeof release.zipball_url !== "string") return undefined;
    try {
      const url = new URL(release.zipball_url);
      return url.origin === "https://api.github.com" && !url.username && !url.password &&
        url.pathname.startsWith(`/repos/${repository}/zipball/`) ? release.zipball_url : undefined;
    } catch {
      return undefined;
    }
  }

  function render(project) {
    const { element, repository, release, loading, fallback } = project;
    const status = element.querySelector("[data-release-status]");
    const releaseLink = element.querySelector("[data-release-link]");
    const list = element.querySelector("[data-downloads]");
    const note = element.querySelector("[data-download-note]");

    status.textContent = site.t(loading ? "loadingRelease" : release
      ? (release.prerelease ? "previewRelease" : "stableRelease") : "releaseUnavailable");
    releaseLink.href = release ? release.html_url : fallback;
    releaseLink.textContent = release ? release.tag_name : site.t("releases");
    list.replaceChildren();
    list.hidden = true;
    note.textContent = "";
    note.hidden = true;
    if (!release) return;

    let missing = false;
    for (const download of downloads[repository]) {
      const url = download.source ? sourceArchive(release, repository)
        : site.asset(release, download.pattern)?.browser_download_url;
      if (!url) {
        missing = true;
        continue;
      }
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = url;
      link.textContent = site.t(download.label);
      item.append(link);
      list.append(item);
    }
    list.hidden = list.children.length === 0;
    note.hidden = !missing;
    if (missing) note.textContent = site.t("downloadsIncomplete");
  }

  document.addEventListener("idy:languagechange", () => projects.forEach(render));
  site.init(translations);

  const copyStatus = document.querySelector("[data-homebrew-status]");
  let copyStatusKey = "";
  document.addEventListener("idy:languagechange", () => {
    if (copyStatus && copyStatusKey) copyStatus.textContent = site.t(copyStatusKey);
  });
  for (const button of document.querySelectorAll("[data-homebrew-copy]")) {
    const command = button.closest(".homebrew-command-row")?.querySelector("code");
    if (!command || !copyStatus) continue;
    button.hidden = false;
    button.addEventListener("click", async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(command.textContent);
        copyStatusKey = "homebrewCopied";
      } catch {
        copyStatusKey = "homebrewManual";
        try {
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(command);
            selection.removeAllRanges();
            selection.addRange(range);
            copyStatusKey = "homebrewSelected";
          }
        } catch { /* The command remains selectable for manual copying. */ }
      }
      copyStatus.textContent = site.t(copyStatusKey);
    });
  }

  for (const project of projects) {
    site.loadRelease(project.repository)
      .then(release => { project.release = release; })
      .catch(() => { project.release = null; })
      .finally(() => { project.loading = false; render(project); });
  }
})();
