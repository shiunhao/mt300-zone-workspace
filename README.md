# MT300 WebUI

依 MT300 截圖製作的本機 UI 原型，沿用 S311／TR615 的 React + Vite 與深色 Pro AV 樣式。

## 本機預覽

```powershell
npm install
npm run dev
```

開啟 http://127.0.0.1:5175 ，預設顯示 V2 Map Setting Dialog 的 Auto Mode Settings。

Talker Position Zone Map 直達預覽：http://127.0.0.1:5175/?view=talker-position 。關閉地圖後回到 Channel Configure，可沿正常設定流程操作。

```powershell
npm run build
```

## 本次範圍

- 設定頁右上角 X 可返回首頁，首頁齒輪可重新進入設定，保留設計版本、模式、群組與地圖資料。首頁 Live Mode 關閉時顯示辦公室靜態 Live View、八組 Profile N Auto Mode、音訊圖示、Device Status 與帳號選單；開啟時改為六種布局工具列、可拖放／點選配置的四個輸出位置、右側 PTZ／AF／Zoom／Preset 與八張攝影機縮圖。布局與首頁往返保留本次配置，PTZ 僅操作示範圖片與前端數值，Preset 只示範選取，沒有實際串流、設備控制或 Preset API。Device Status 的 0／2/8 是依參考圖顯示的靜態示範值。Reset 暫停用，待確認要清除的範圍。
- 首頁 Profile 有八組，選單收合與展開時皆以白色顯示 Profile N、藍色顯示 Auto Mode，支援滑鼠與鍵盤操作；進入設定時同步顯示所選編號。在設定頁選取另一個 Profile 屬於查看行為，不會改變首頁使用的 Profile。各 Profile 的獨立配置資料尚未實作，目前仍共用原型設定。
- 首頁設定齒輪改為置中的八齒圖示。首頁 Live View 圖片改用 `src/assets/office-empty-desk-v2.png`，將室內盆栽換成文件盤、筆筒、資料夾與印表機；由內建 image_gen 編輯，完整提示見 `src/assets/office-preview-v2.md`。Manual Mode 預覽仍使用原圖。
- 帳號選單提供 Admin／User。切到 User 不需輸入；User 切回 Admin 開啟 Upgrade Permission，原型使用示範帳密 `demo`／`demo`，錯誤輸入顯示訊息，Cancel／X／Escape 關閉且清除輸入。此為前端示範，不是設備驗證或正式權限機制；沒有傳送、記錄或持久保存輸入的帳密。User 可直接進入 Settings，只可查看 Help／Profile，Device 與其他設定導覽停用。Profile 保留群組、分頁、搜尋、分頁與地圖視角瀏覽；群組開關、Channel、Manual、設定檔與區域編輯都停用並加上操作守衛。Channel Configure 可唯讀查看，包含 V2 的 Map Setting 入口；返回 Admin 後恢復操作，原有設定保留。
- Device 頁依參考圖列出八台攝影機與七個麥克風，兩欄清單獨立捲動，IP／USB Port 只作文字展示；未提供的位址顯示「—」。Add device 流程尚未提供，因此按鈕暫停用。Help 提供 Manual、About、Privacy Policy、Console 子頁籤；Manual 顯示 Online Software User Manual／Read，Read 連結與其他三頁內容尚待補充，沒有執行 Console 指令。
- Profile／Auto Mode Settings／Group 清單／Channel、Active Position 與新版 Zone Map (Talker Position) 分頁。
- G1、G2、G3 選取，Group 開關，地圖縮放與置中。
- Channel／Active Position 分頁可點選切換，支援方向鍵與 Home／End。
- 分頁切換採用 230ms 淡入與輕微位移，藍色底線滑動；遵循系統減少動態效果偏好。
- Channel 每頁顯示 8 列 Microphone／Camera／Human tracking／Remarks；可選 Preset 0～254、編輯備註、搜尋所有頁面的 Channels。分頁、備註與 Preset 依群組分別保留；搜尋變更時回到第 1 頁。
- V1～V4 的 Group ＋ 開啟 Link Camera & MIC：名稱可空白，留白時依穩定 ID 自動命名 G＋流水號；可選現有示範攝影機及 MIC-01／MIC-02，MIC Channels 為 8、16、…、248、255。Camera、MIC、Channels 均必填，名稱不分大小寫不可重複；Cancel、X、Escape 皆不建立資料。Save 後預設啟用並選取新群組，顯示 Channel 分頁；255 Channels 共 32 頁，最後一頁七列。新群組 Preset 與備註初始空白、Human tracking 為 Off，Pickup Mode 沿用 Talker Position；Zone Map 初始空白，依連結的麥克風出現在縮圖，首個新增區域為 Zone 1。自訂名稱在群組清單、地圖與設定檔使用清單同步顯示，長名稱截斷並保留提示。V1～V2 沿用共用的群組清單，地圖仍各版本獨立；V3、V4 的新增群組與設定分開保留。本機原型未連線設備，重新整理回到展示資料。
- Profile、Output Layout、Position view 保留截圖中的選項。
- Channel Configure 提供 Lobe／Coverage／Talker Position 與對應欄位，Map Setting 依版本進入分頁或設定視窗。頂部移除可見標題及 Group／Microphone settings 副標，保留右側關閉按鈕與對話框無障礙名稱。
- V1～V4 共用可操作的 Manual Mode Settings：左側 Output Layout 支援 Single、Side-by-side、Main Speaker (3-inputs)、Main Speaker (4-inputs)、PIP、Quad View。Quad View 為 2×2 四格；右側依布局顯示 1／2／3／4／2／4 列 Camera、Preset、Human tracking 與 Set preset。點選預覽格子可定位對應列，切換布局保留暫時隱藏列的設定。Human tracking 依參考圖呈現停用的 Off。Manual、Auto、Microphone Zones 可用方向鍵及 Home／End 切換，切換版本與回饋頁保留 Manual 的布局與攝影機配置。
- Manual 的 Set preset 進入完整設定頁：攝影機名稱與 Back 在頂部，左側為辦公室靜態預覽，右側為 PTZ、AF／手動對焦、Zoom 及 Preset setting。Preset 編號為 0～254，每頁九格，共 29 頁，最後一頁為 252～254；翻頁預選新頁第一格。Save 只儲存該攝影機與編號的 PTZ／對焦設定，停留在設定頁，Back 返回後不會自動更改輸出列使用的 Preset。表格選取已儲存編號可在原型中套用該位置；右側攝影機控制視窗與設定頁共用每台攝影機狀態。所有資料只保留本次開啟頁面，重新整理重置。預覽圖由內建 image_gen 生成，圖檔與完整提示見 `src/assets/office-empty-desk.png`、`src/assets/office-preview.md`，未連線實際攝影機。
- 右上角懸浮 Design version 選單可即時切換 V1 Independent Group Maps、V2 Map Setting Dialog、V3 Microphone Setup、V4 Zone Settings Library；V2／V3／V4 Zone Map 視窗開啟時隱藏選單，關閉後恢復。
- 預覽初始進入 V4 Microphone Zones 畫面，Auto Mode Settings 與 Manual Mode Settings 保留在同一層；切回 V3 時仍可檢視原有 Auto Mode Group／Channel 畫面及 Microphone Zones 上層頁籤。V2／V3／V4 的 Auto Mode 保留 Channel／Active Position 兩個子分頁。V2 Zone Map 入口位於 Channel Configure 的 Talker Position 設定內。V1 保留 Zone Map 子分頁。
- 版本選單沿用 S311／TR615 的緊湊選單形式，位於 Help／X 下方，不占用原有按鈕的位置。
- 同一個下拉選單可切換「使用者回饋與痛點」討論頁，列出 AVtech Media／Nathan 測試 MT500 V22 的完整英文原文、中文翻譯、痛點整理，以及客戶全域設定要求與 Jira 跨 Group 參照方案的差異。返回設計時保留目前版本、Group、分頁、搜尋及本次頁面的地圖設定。
- 回饋頁以獨立置中內容區呈現，隱藏產品導覽、Profile、模式分頁與 Help／Close，也不顯示返回按鈕；右上角保留下拉選單，直接切換回 V1、V2、V3、V4。
- V3 Microphone Setup 的 Microphone Zones 與 Auto Mode Settings、Manual Mode Settings 位於同一層。Auto Mode 保留 Output Layout、Group 清單、Channel 表格、Active Position、Channel Configure 與 Time；獨立的麥克風頁左側為麥克風選單與該設備搭配的攝影機 Group 縮圖，右側只保留 Zone Map 與 Zone settings。麥克風選單顯示 ID 與型號，記住各麥克風最後選取的 Group，包含停用組。Channel Group 與地圖編輯組分開選取；切換上層頁籤保留 Channel 搜尋、備註、原選取、麥克風選擇、地圖與視角。Channel Configure 的 Map Setting 仍以視窗開啟同一份 V3 地圖，縮圖留在視窗內；關閉返回原 Configure 並保留草稿，取消後內嵌地圖依已儲存模式判斷可否編輯。Group 開關在各入口同步，僅控制該組。切換麥克風、版本及回饋頁保留地圖資料。V3 的地圖、啟用狀態與 Pickup Mode 獨立於 V1、V2、V4；V3 Groups 與其他方案的選取也分開保存。V3 示範資料包含 MIC-01（G1～G3）與 MIC-02（G4、G5），均為 Shure MXA925-S，未連線到實際設備。
- V4 Zone Settings Library 沿用 V3 的上層 Microphone Zones 入口與麥克風／Group 縮圖導覽，初始沒有設定檔，各 Group 的地圖皆為空白。工具列依序為 Zone Settings 下拉選單、Add Zone、Remove Zone、⋯，集中在左側；首次 Add Zone 先命名，隨即建立設定檔、套用目前 Group 並加入 Zone 1。⋯ 提供新增空白設定檔、重新命名、獨立副本與批次刪除；刪除清單只列同一台麥克風的設定檔，以 Checkbox 複選並顯示使用 Groups，刪除後相關 Group 回到未選擇設定檔，不自動替代。選擇設定檔立即套用，直接編輯範圍即更新該設定檔，沒有額外儲存或套用按鈕。多個 Groups 選用同一份設定檔時共用範圍；設定檔只共用位置與尺寸，攝影機及 Channel 配置仍屬於各 Group。主地圖保留完整高度與右側座標卡片對齊，不出現捲軸；設定檔管理使用彈窗，麥克風與 Group 資訊保留在左側。Channel Configure → Talker Position → Map Setting 可開啟同一份 V4 設定，關閉後回到原 Configure 並保留草稿。V4 資料與其他版本隔離；切換麥克風、頁籤、版本及回饋頁保留本次頁面的設定，重新整理則回到沒有設定檔的初始狀態。
- V4 的 Microphone Zones 首次進入或首次切到另一台麥克風時不預選 Group，主圖提示「請先從左側選擇群組，開始設定區域。」，設定檔與 Zone 編輯需先點選左側縮圖。主動選過後，各麥克風各自記住最後選的 Group，包含尚未建立設定檔或已停用的組；刪除設定檔不清除 Group 選取。切回 Auto Mode、其他版本或回饋頁再返回，保留麥克風頁自己的選取紀錄，Auto Mode 選取不會覆蓋它。Channel Configure 的 Map Setting 按鈕屬於指定 Group 的直接入口，會明確開啟來源麥克風與 Group。
- V1：每個 Group 獨立編輯，其他 Group 的同 mic zones 作為只讀虛線參照。
- V2 沿用原設計流程：Channel Configure → Talker Position → Map Setting → Zone Map 視窗。編輯對象固定為進入 Channel Configure 時選擇的來源 Group，視窗頂部只保留 Zone Map 與關閉按鈕，移除 Group／攝影機／Enabled 文字及開關；啟用狀態沿用 Auto Mode 的 Group 開關。其他組仍可透過 View Other Groups’ Zones 勾選為彩色虛線唯讀參照；保留新增、刪除、四角縮放、手動座標與尺寸、重疊排斥、51 × 51 格平移與 25%～150% 縮放。各組與各方案的地圖資料獨立，關閉或切換後仍保留本次頁面的資料。
- V2 關閉地圖視窗後回到原本的 Channel Configure，保留尚未儲存的 Pickup Mode；在草稿中選 Talker Position 即可開啟 Map Setting，不會自動儲存模式。若要編輯另一個 Group，須關閉視窗並回到 Auto Mode 的 Group 清單重新選取，避免視窗內編輯對象與來源 Configure 不一致。
- 新版支援 Zone 新增、選取、刪除、拖曳、四角尺寸調整，以及 X／Y／Width／Height 手動輸入。四角把手拖曳時固定對角，尺寸與座標欄位同步更新。選取狀態以加粗亮色框線與較深填色呈現，點擊地圖空白處解除選取。
- 每個當前 Group 的 Zone 中心以虛線連接 mic，拖曳、調整尺寸或輸入數值時同步更新。
- 桌面版三個分頁共用可用畫面高度；Zone Map 背景容器內整合麥克風型號、Add Zone、Remove Zone 與 View Other Groups’ Zones 下拉選單，右側設定面板分開。麥克風 ID 標題、Map 狀態 Badge、Reference groups 標題、底部圖例與展示文字已移除。
- View Other Groups’ Zones 下拉清單可用 Checkbox 複選參照 Groups，預設全部不勾選；勾選立即顯示對應 Zones，取消即隱藏。清單超過可用高度時只在選單內捲動。
- 參考 Group 依 ID 使用固定顏色，選單色點與地圖虛線一致；G1 為橘色、G3 為紫色。當前 Group 的 Zone 保持藍色，重疊衝突使用紅色。
- 移除右側 Zone settings 的 Editable 字樣與分頁列右上方 Pickup Mode 文字，模式用途直接顯示在 Zone Map (Talker Position) 分頁名稱。較長分頁使用較寬區域，保留切換動畫。
- 當前 Group 的開關關閉時，該組的編輯地圖整體反灰並停用；重新開啟保留資料與視角，其他 Group 仍可切換查看。
- Zone 拖曳或尺寸調整時，若與當前 Map 的另一個 Zone 重疊，會顯示紅色衝突狀態；在重疊處放開會回到拖曳前的完整位置與尺寸。其他 Group 的只讀參照不參與碰撞，僅邊界相接不算重疊。鍵盤與手動欄位也拒絕重疊結果。
- Zone Map 整張格子地圖為 51 × 51 格。按住空白格拖曳可平移地圖；直接拖曳或用方向鍵移動 Zone 時，整個區塊會限制在當前畫布內，點擊空白處解除選取。數值輸入仍可移出目前視野；若輸入尺寸大於畫布，須先 Zoom out 才能拖曳整個區塊。平移只改變視角，不修改座標或尺寸。
- 數值超出範圍的 Warning 同時列出該欄位目前的 Minimum／Maximum（m）；數字依 Zone 的位置與尺寸計算，座標欄位保留負數下限。
- No zones yet 時仍可平移、縮放及置中查看地圖，刪除最後一個 Zone 保留當前視角；Zone settings 維持停用，新增 Zone 後才可編輯。參照選單中尚無 Zone 的群組顯示 No zones configured，並停用該列勾選。
- 地圖內右下角懸浮工具框提供 View／百分比、置中、縮小、放大與 Coordinates。Zone Map 滾輪及按鈕縮放限制為 25%～150%，Active Position 維持 25%～125%；置中同時清除平移並恢復 100%，不修改 Zone 幾何資料。
- 切換分頁、Group 與設計版本保留本次開啟頁面的地圖資料；重新整理會還原展示資料。
- Video & Audio、Network、NDI、System、Time 與 Re-configure 仍保留外觀。
- 所有設定只影響本機原型；未連線到 MT300。地圖為 51 × 51 格，每格 0.6 × 0.6 m（整張 30.6 × 30.6 m），Zone 最小寬高為 0.6 m。拖曳放大受目前可見範圍限制；數值輸入依整張 Map 範圍驗證，Zone 移出目前視野仍可套用。欄位輸入於 Enter／離開欄位時驗證，重疊、超出 Map 等錯誤統一顯示 Warning 視窗；按 OK 後恢復最後有效值，不使用欄位紅框或行內錯誤文字。拖曳重疊維持原本紅色預覽與拒絕套用，不開啟警告視窗。MIC-01、矩形 Zones 及 mic 中心原點仍為預覽假設。整張地圖的邊緣可透過平移查看。

樣式變數位於 `src/index.css`，地圖元件位於 `src/components/PositionMap.jsx`。

## GitHub Pages

線上展示：https://shiunhao.github.io/mt300-zone-workspace/

推送至 `main` 後，GitHub Actions 會安裝依賴、建置並發布到 GitHub Pages。部署時使用 Repo 名稱作為網站路徑，本機預覽設定維持不變。
