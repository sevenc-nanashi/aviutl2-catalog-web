export const messages = {
  ja: {
    common: {
      appName: "AviUtl2 Catalog Web",
      navigation: {
        main: "メインナビゲーション",
        packages: "パッケージ一覧",
        badge: "バッジを作成",
        about: "このサイトについて",
      },
      language: {
        label: "表示言語",
        ja: "日本語",
        en: "English",
      },
      labels: {
        id: "ID",
        type: "種類",
        author: "作者",
        tags: "タグ",
        licenses: "ライセンス",
        summary: "概要",
        description: "詳細説明",
        niconiCommonsId: "ニコニ・コモンズID",
      },
      packageTypes: {
        all: "すべて",
        core: "本体",
        mod: "MOD",
        inputPlugin: "入力プラグイン",
        outputPlugin: "出力プラグイン",
        generalPlugin: "汎用プラグイン",
        filterPlugin: "フィルタプラグイン",
        script: "スクリプト",
        other: "その他",
      },
      markdownAlerts: {
        note: "注記",
        tip: "ヒント",
        important: "重要",
        warning: "警告",
        caution: "注意",
      },
      footer: {
        unofficial:
          "このページはAviUtl2 Catalogと関係のない非公式のページです。",
      },
    },
    home: {
      title: "パッケージ一覧",
      search: {
        region: "パッケージの検索と絞り込み",
        label: "パッケージを検索",
        clear: "検索語をクリア",
        placeholder: "パッケージ名、作者、キーワードで検索...",
      },
      filters: {
        label: "絞り込み",
        deprecation: "非推奨状態",
        tagFilter: "タグ絞り込み",
        category: "種類",
        categoryAria: "パッケージの種類",
        sort: "並び替え",
        count: "件",
        selected: "選択中:",
        clearAll: "すべてクリア",
        allTags: "すべてのタグ",
        clearSelection: "選択をクリア",
      },
      deprecationStatus: {
        active: "非推奨を除外",
        deprecated: "非推奨のみ",
        all: "すべて",
      },
      sortOptions: {
        popularity_desc: "人気順",
        trend_desc: "トレンド順",
        added_desc: "新着順",
        updated_desc: "最終更新日順",
      },
      card: {
        openDetails: "{name} の詳細を開く",
        deprecated: "非推奨",
        directDownload: "ダウンロード",
        details: "詳細表示",
      },
      empty: {
        title: "条件に一致するパッケージはありません",
        clear: "条件をクリア",
      },
      errors: {
        loadFailed: "パッケージ一覧を取得できませんでした。",
      },
    },
    package: {
      breadcrumb: {
        label: "パンくずリスト",
        home: "パッケージ一覧",
      },
      carousel: {
        region: "スクリーンショットカルーセル",
        image: "{name}のスクリーンショット {index}",
        previous: "前の画像へ",
        next: "次の画像へ",
        slide: "スライド {current}/{total}",
      },
      content: {
        screenshots: "スクリーンショット",
        deprecated: "非推奨",
        deprecatedReason: "このパッケージは以下の理由で非推奨となっています。",
        deprecatedSimple: "このパッケージは非推奨となっています。",
        dependencies: "依存関係",
      },
      header: {
        uncategorized: "未分類",
      },
      sidebar: {
        region: "パッケージ情報",
        updatedAt: "更新日",
        latestVersion: "最新バージョン",
        originalAuthor: "原作者",
        versionUnknown: "不明",
        repository: "配布元ページを開く",
        directDownload: "ダウンロード",
        openCatalog: "カタログで開く",
      },
      errors: {
        loadFailed: "パッケージ情報を取得できませんでした。",
        notFound: "パッケージ「{id}」は登録されていません。",
        downloadNotFound: "パッケージが見つかりませんでした。",
        directDownloadUnavailable: "直接ダウンロードを利用できません。",
        downloadFailed: "ダウンロード先を取得できませんでした。",
      },
    },
    badge: {
      title: "バッジを作成",
      packageId: "パッケージIDを入力してください。",
      codeHelp: "以下のコードをコピーして、READMEなどに貼り付けてください。",
      badgeUrlHelp:
        "以下のURLをコピーして、バッジ画像のURLとして使用してください。",
      pageUrlHelp: "以下のURLにアクセスすると、詳細ページに移動します。",
      preview: "プレビュー：",
      none: "（なし）",
    },
    about: {
      title: "このサイトについて",
      project: {
        title: "このサイトについて",
        description:
          "このページはAviUtl2 Catalogで公開されているパッケージ情報を閲覧できる非公式のWebサイトです。\nこのサイトはAviUtl2 Catalogの開発者やパッケージの作者とは関係ありません。",
        catalog: "AviUtl2 Catalog",
        catalogDescription: "このサイトが参照しているカタログプロジェクト",
        source: "AviUtl2 Catalog Web",
        sourceDescription: "このWebサイトのソースコード",
      },
      donation: {
        title: "GitHub API枠を寄付する",
        description:
          "GitHubで配布されているパッケージのダウンロード先を安定して取得するため、あなたのAPI利用枠を共有プールへ提供できます。",
        before: {
          title: "認可する前に",
          permissionTitle: "追加権限は要求しません",
          permissionDescription:
            "公開プロフィールや公開リポジトリなど、誰でも閲覧できる情報の読み取りにだけ使います。",
          quotaTitle: "あなたの利用枠を共有します",
          quotaDescription:
            "寄付されたトークンを使った通信は、あなたのGitHub API利用枠（通常5,000回/時）に数えられます。",
          storageTitle: "トークンは暗号化して保存します",
          storageDescription:
            "サーバー上で暗号化し、公開GitHub APIからダウンロード先を取得する目的以外には使用しません。",
          revokeTitle: "GitHubからいつでも失効できます",
          revokeDescription:
            "認可を取り消すと、次にトークンの失効を検知した時点で保存データと掲載名を削除します。",
          revokeLink: "GitHubの認可済みアプリを確認",
        },
        publish: {
          label: "寄付者一覧にGitHub名を掲載する",
          help: "任意です。未選択の場合も匿名の寄付として総数に含まれます。",
        },
        action: "GitHubでトークンを寄付",
        actionRedirecting: "GitHubへ移動しています",
        consent:
          "ボタンを押すとGitHubの認可画面へ移動します。リポジトリへの書き込み権限は要求しません。",
        revokeInfo: "GitHubの設定画面からトークンを失効できます。",
        results: {
          success: {
            title: "トークンを受け取りました",
            description: "共有プールへのご協力ありがとうございます。",
          },
          cancelled: {
            title: "認可をキャンセルしました",
            description:
              "トークンは保存されていません。必要になったときにもう一度お試しください。",
          },
          invalid_request: {
            title: "認可を確認できませんでした",
            description:
              "認可情報の有効期限が切れた可能性があります。このページからもう一度お試しください。",
          },
          authorization_failed: {
            title: "GitHubとの接続を完了できませんでした",
            description:
              "時間をおいてから、このページでもう一度お試しください。",
          },
          configuration_error: {
            title: "現在は寄付を受け付けられません",
            description:
              "サーバーの準備が完了していません。設定が完了するまでお待ちください。",
          },
          storage_error: {
            title: "トークンを保存できませんでした",
            description:
              "トークンは共有プールで使用されません。時間をおいてからもう一度お試しください。",
          },
        },
      },
      donors: {
        title: "トークンを寄付してくださった方々",
        description:
          "名前の掲載に同意した寄付者を紹介します。総数には匿名の寄付も含まれます。",
        loading: "寄付状況を読み込んでいます",
        error:
          "寄付状況を取得できませんでした。通信状態を確認して、もう一度お試しください。",
        retry: "寄付状況を再読み込み",
        count: "現在 {count} 件のトークンが共有されています。",
        anonymousOnly:
          "現在の寄付はすべて匿名です。名前を公開せずに支えることもできます。",
        empty:
          "まだ寄付されたトークンはありません。最初の一人として支えることができます。",
      },
    },
    error: {
      notFoundTitle: "404 - ページが見つかりません",
      genericTitle: "エラーが発生しました",
      notFoundDescription: "指定されたページは存在しないか、移動されました。",
      genericDescription:
        "エラーが発生しました。時間をおいて再度お試しください。",
    },
  },
  en: {
    common: {
      appName: "AviUtl2 Catalog Web",
      navigation: {
        main: "Main navigation",
        packages: "Package List",
        badge: "Create Badge",
        about: "About",
      },
      language: {
        label: "Display language",
        ja: "日本語",
        en: "English",
      },
      labels: {
        id: "ID",
        type: "Type",
        author: "Author",
        tags: "Tags",
        licenses: "Licenses",
        summary: "Summary",
        description: "Description",
        niconiCommonsId: "Niconi Commons ID",
      },
      packageTypes: {
        all: "All",
        core: "Core",
        mod: "Mod",
        inputPlugin: "Input Plugins",
        outputPlugin: "Output Plugins",
        generalPlugin: "General Plugins",
        filterPlugin: "Filter Plugins",
        script: "Script",
        other: "Other",
      },
      markdownAlerts: {
        note: "Note",
        tip: "Tip",
        important: "Important",
        warning: "Warning",
        caution: "Caution",
      },
      footer: {
        unofficial:
          "This is an unofficial website and is not affiliated with AviUtl2 Catalog.",
      },
    },
    home: {
      title: "Package List",
      search: {
        region: "Package search and filters",
        label: "Search packages",
        clear: "Clear search",
        placeholder: "Search by package name, author, or keyword...",
      },
      filters: {
        label: "Filters",
        deprecation: "Deprecation status",
        tagFilter: "Tag filter",
        category: "Category",
        categoryAria: "Package category",
        sort: "Sort",
        count: "items",
        selected: "Selected:",
        clearAll: "Clear all",
        allTags: "All tags",
        clearSelection: "Clear selection",
      },
      deprecationStatus: {
        active: "Hide deprecated",
        deprecated: "Deprecated only",
        all: "All",
      },
      sortOptions: {
        popularity_desc: "Popularity",
        trend_desc: "Trending",
        added_desc: "Recently added",
        updated_desc: "Recently updated",
      },
      card: {
        openDetails: "Open details for {name}",
        deprecated: "Deprecated",
        directDownload: "Download",
        details: "View details",
      },
      empty: {
        title: "No packages match the current filters",
        clear: "Clear filters",
      },
      errors: {
        loadFailed: "Failed to load the package list.",
      },
    },
    package: {
      breadcrumb: {
        label: "Breadcrumb",
        home: "Package List",
      },
      carousel: {
        region: "Screenshot carousel",
        image: "Screenshot {index} of {name}",
        previous: "Previous image",
        next: "Next image",
        slide: "Slide {current}/{total}",
      },
      content: {
        screenshots: "Screenshots",
        deprecated: "Deprecated",
        deprecatedReason:
          "This package is deprecated for the following reason.",
        deprecatedSimple: "This package is deprecated.",
        dependencies: "Dependencies",
      },
      header: {
        uncategorized: "Uncategorized",
      },
      sidebar: {
        region: "Package information",
        updatedAt: "Updated",
        latestVersion: "Latest version",
        originalAuthor: "Original author",
        versionUnknown: "Unknown",
        repository: "Open package page",
        directDownload: "Download",
        openCatalog: "Open in Catalog",
      },
      errors: {
        loadFailed: "Failed to load the package details.",
        notFound: "Package “{id}” is not registered.",
        downloadNotFound: "Package not found.",
        directDownloadUnavailable: "Direct download is unavailable.",
        downloadFailed: "Failed to resolve the download URL.",
      },
    },
    badge: {
      title: "Create Badge",
      packageId: "Enter a package ID.",
      codeHelp:
        "Copy the following code and paste it into your README or other document.",
      badgeUrlHelp: "Copy the following URL and use it as the badge image URL.",
      pageUrlHelp: "Open the following URL to go to the package page.",
      preview: "Preview:",
      none: "(none)",
    },
    about: {
      title: "About",
      project: {
        title: "About this site",
        description:
          "This website is an unofficial web interface for browsing package information published on AviUtl2 Catalog.\nThis site is not affiliated with the developers of AviUtl2 Catalog or the authors of the packages.",
        catalog: "AviUtl2 Catalog",
        catalogDescription:
          "The catalog project used as this site's data source",
        source: "AviUtl2 Catalog Web",
        sourceDescription: "Source code for this website",
      },
      donation: {
        title: "Donate GitHub API quota",
        description:
          "You can contribute your API quota to a shared pool that helps this site reliably resolve downloads hosted on GitHub.",
        before: {
          title: "Before you authorize",
          permissionTitle: "No additional permissions",
          permissionDescription:
            "The token is limited to reading public information such as public profiles and repositories.",
          quotaTitle: "Your quota is shared",
          quotaDescription:
            "Requests made with your donated token count toward your GitHub API quota, normally 5,000 requests per hour.",
          storageTitle: "The token is stored encrypted",
          storageDescription:
            "It is encrypted on the server and used only to resolve downloads through the public GitHub API.",
          revokeTitle: "Revoke access from GitHub at any time",
          revokeDescription:
            "After you revoke access, the saved data and published name are deleted when the invalid token is next detected.",
          revokeLink: "Review authorized GitHub apps",
        },
        publish: {
          label: "Publish my GitHub name in the donor list",
          help: "Optional. Anonymous donations still count toward the total.",
        },
        action: "Donate a token with GitHub",
        actionRedirecting: "Opening GitHub",
        consent:
          "The button opens GitHub's authorization screen. This site does not request permission to write to repositories.",
        revokeInfo:
          "You can revoke the token from GitHub's settings page for authorized applications.",
        results: {
          success: {
            title: "Your token has been received",
            description: "Thank you for contributing to the shared pool.",
          },
          cancelled: {
            title: "Authorization cancelled",
            description:
              "No token was saved. You can try again from this page whenever you are ready.",
          },
          invalid_request: {
            title: "Authorization could not be verified",
            description:
              "The authorization may have expired. Please start again from this page.",
          },
          authorization_failed: {
            title: "GitHub connection could not be completed",
            description: "Please wait a moment, then try again from this page.",
          },
          configuration_error: {
            title: "Token donations are currently unavailable",
            description:
              "Server setup is not complete. Please wait until configuration is finished.",
          },
          storage_error: {
            title: "Your token could not be saved",
            description:
              "It will not be used by the shared pool. Please wait a moment and try again.",
          },
        },
      },
      donors: {
        title: "Community supporters",
        description:
          "Donors who opted to publish their names are listed here. The total also includes anonymous donations.",
        loading: "Loading donation status",
        error:
          "Donation status could not be loaded. Check your connection and try again.",
        retry: "Reload donation status",
        count: "{count} tokens are currently shared.",
        anonymousOnly:
          "All current donations are anonymous. You can help without publishing your name.",
        empty:
          "No tokens have been donated yet. You can be the first person to help.",
      },
    },
    error: {
      notFoundTitle: "404 - Page Not Found",
      genericTitle: "Something went wrong",
      notFoundDescription:
        "The page you requested does not exist or has been moved.",
      genericDescription:
        "An error occurred. Please wait a moment and try again.",
    },
  },
} as const;
