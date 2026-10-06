# MT300 WebUI

依 MT300 截圖製作的本機 UI 原型，沿用 S311／TR615 的 React + Vite 與深色 Pro AV 樣式。

## 本機預覽

```powershell
npm install
npm run dev
```

開啟 http://127.0.0.1:5174 。

```powershell
npm run build
```

## 本次範圍

- Profile／Auto Mode Settings／Group 清單／Channel、Active Position 與新版 Zone Map (Talker Position) 分頁。
- G1、G2、G3 選取，Group 開關，地圖縮放與置中。
- Channel／Active Position 分頁可點選切換，支援方向鍵與 Home／End。
- 分頁切換採用 230ms 淡入與輕微位移，藍色底線滑動；遵循系統減少動態效果偏好。
- Channel 顯示 8 列 Microphone／Camera／Human tracking／Remarks；可選 Preset、編輯備註、搜尋。
- Profile、Output Layout、Position view 保留截圖中的選項。
- Channel Configure 提供 Lobe／Coverage／Talker Position 與對應欄位，Map Setting 依版本進入分頁、工作區或設定視窗。
- 右上角懸浮 Design version 選單可即時切換 V1 Independent Group Maps、V2 Zone Workspace、V3 Map Setting Dialog、V4 Group Previews；V3／V4 Zone Map 視窗開啟時隱藏選單，關閉後恢復。V0 原版已移除。
- 預覽初始進入 V4 Channel，只有 Channel／Active Position 兩個子分頁。V2／V4 的按鈕依序為 Channel Configure、Zone Map、Time；V2 開啟 Zone Workspace，V4 直接開啟 Group Previews 設定視窗，關閉後回到 Channel 並保留地圖設定。V3 Zone Map 入口位於 Channel Configure 的 Talker Position 設定內。V1 保留 Zone Map 子分頁。
- 版本選單沿用 S311／TR615 的緊湊選單形式，位於 Help／X 下方，不占用原有按鈕的位置。
- 同一個下拉選單可切換「使用者回饋與痛點」討論頁，列出 AVtech Media／Nathan 測試 MT500 V22 的完整英文原文、中文翻譯、痛點整理，以及客戶全域設定要求與 Jira 跨 Group 參照方案的差異。返回設計時保留目前版本、Group、分頁、搜尋及本次頁面的地圖設定。
- 回饋頁以獨立置中內容區呈現，隱藏產品導覽、Profile、模式分頁與 Help／Close，也不顯示返回按鈕；右上角保留下拉選單，直接切換回 V1～V4。
- V1：每個 Group 獨立編輯，其他 Group 的同 mic zones 作為只讀虛線參照。
- V2：以 MIC-01 為中心的 Zone Workspace，左側 Group 圖層清單、中間多 Group 地圖與右側 Zone 設定。從 Channel 進入時為唯讀 Overview，顯示當前 Group 的圖層；明確按 Edit 才編輯所選 Group，其他 Groups 維持唯讀。圖層使用各組固定顏色，當前編輯組為藍色。
- V2 圖層使用眼睛按鈕顯示／隱藏，開眼表示顯示、劃線眼表示隱藏。圖層顯示與 Group 啟用開關分開操作；複製目標仍使用 Checkbox。
- V2 提供 Copy Zones to Groups：選來源與目標，預覽各目標的 Before／After，再明確套用。第一版以取代目標整份 Map 的方式複製；目標既有 Zones 會在預覽中顯示。取消不修改資料，套用後各組獨立保存，來源後續修改不會自動同步。停用或非 Talker Position 的 Groups 不可作為複製目標。
- V2 的 Back to Channel 返回所選 Group，Map Setting 捷徑也可開啟 Zone Workspace；切換保留地圖資料、視角與其他圖層顯示選擇。
- V3 沿用原設計流程：Channel Configure → Talker Position → Map Setting → Zone Map 視窗。視窗上方可切換 Group 與啟用狀態，當前組可直接編輯，其他組可作為彩色虛線參照；保留新增、刪除、四角縮放、手動座標與尺寸、重疊排斥、51 × 51 格平移與 25%～150% 縮放。各組與各方案的地圖資料獨立，關閉或切換後仍保留本次頁面的資料。
- V3 關閉地圖視窗後回到原本的 Channel Configure，保留尚未儲存的 Pickup Mode；在草稿中選 Talker Position 即可開啟 Map Setting，不會自動儲存模式。切換視窗內 Group 不改變原本 Configure 的 Group；其他組仍受已儲存的 Pickup Mode 與停用狀態限制。
- V4 Group Previews 從 Channel Configure 旁的 Zone Map 按鈕直接進入，Channel Configure 內仍保留 Map Setting 捷徑。直接開啟使用當前 Group 已儲存的 Pickup Mode，非 Talker Position 的 Group 地圖維持反灰。左側將所有 Groups 各自顯示為一張唯讀縮圖，中間主圖只編輯目前 Group，右側保留 Zone settings。點縮圖切換編輯組，目前組以藍色框線標示，各卡片提供獨立啟用開關；上方只有 Zone Map 與關閉按鈕，移除 Group 下拉選單、啟用開關及縮圖區小標題。左側獨立捲動，小螢幕改為橫向縮圖列。各縮圖採用相同原點與比例，包含麥克風、Zone 編號及各組固定顏色，停用組反灰。已提交的新增、刪除、位置與尺寸變更同步反映在縮圖中，V4 地圖資料與其他方案獨立保存。
- 新版支援 Zone 新增、選取、刪除、拖曳、四角尺寸調整，以及 X／Y／Width／Height 手動輸入。四角把手拖曳時固定對角，尺寸與座標欄位同步更新。選取狀態以加粗亮色框線與較深填色呈現，點擊地圖空白處解除選取。
- 每個當前 Group 的 Zone 中心以虛線連接 mic，拖曳、調整尺寸或輸入數值時同步更新。
- 桌面版三個分頁共用可用畫面高度；Zone Map 背景容器內整合麥克風型號、Add Zone、Remove Zone 與 View Other Groups’ Zones 下拉選單，右側設定面板分開。麥克風 ID 標題、Map 狀態 Badge、Reference groups 標題、底部圖例與展示文字已移除。
- View Other Groups’ Zones 下拉清單可用 Checkbox 複選參照 Groups，預設全部不勾選；勾選立即顯示對應 Zones，取消即隱藏。清單超過可用高度時只在選單內捲動。
- 參考 Group 依 ID 使用固定顏色，選單色點與地圖虛線一致；G1 為橘色、G3 為紫色。當前 Group 的 Zone 保持藍色，重疊衝突使用紅色。
- 移除右側 Zone settings 的 Editable 字樣與分頁列右上方 Pickup Mode 文字，模式用途直接顯示在 Zone Map (Talker Position) 分頁名稱。較長分頁使用較寬區域，保留切換動畫。
- 當前 Group 的開關關閉時，V1 與 V2 該組的編輯地圖整體反灰並停用；重新開啟保留資料與視角。V2 Overview 仍可平移、縮放及唯讀查看停用組的區域，不會被單一停用 Group 鎖住整個總覽。
- Zone 拖曳或尺寸調整時，若與當前 Map 的另一個 Zone 重疊，會顯示紅色衝突狀態；在重疊處放開會回到拖曳前的完整位置與尺寸。其他 Group 的只讀參照不參與碰撞，僅邊界相接不算重疊。鍵盤與手動欄位也拒絕重疊結果。
- Zone Map 整張格子地圖為 51 × 51 格。按住空白格拖曳可平移地圖；拖曳 Zone 移動區域，點擊空白處解除選取。平移只改變視角，不修改座標或尺寸。
- 地圖內右下角懸浮工具框提供 View／百分比、置中、縮小、放大與 Coordinates。Zone Map 滾輪及按鈕縮放限制為 25%～150%，Active Position 維持 25%～125%；置中同時清除平移並恢復 100%，不修改 Zone 幾何資料。
- 切換分頁、Group 與設計版本保留本次開啟頁面的地圖資料；重新整理會還原展示資料。
- 導覽、Manual Mode、Group 新增、Time、Re-configure、Help 與 Close settings 仍保留外觀。
- 所有設定只影響本機原型；未連線到 MT300。51 × 51 格由使用者指定；每格延續原型 0.5 m 的比例（整張 25.5 × 25.5 m）、MIC-01、矩形 Zones 及 mic 中心原點仍為預覽假設，待設備規格確認。100% 延續原有顯示比例，整張地圖的邊緣可透過平移查看。

樣式變數位於 `src/index.css`，地圖元件位於 `src/components/PositionMap.jsx`。

## GitHub Pages

線上展示：https://shiunhao.github.io/mt300-zone-workspace/

推送至 `main` 後，GitHub Actions 會安裝依賴、建置並發布到 GitHub Pages。部署時使用 Repo 名稱作為網站路徑，本機預覽設定維持不變。
