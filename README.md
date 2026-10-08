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
- Channel Configure 提供 Lobe／Coverage／Talker Position 與對應欄位，Map Setting 依版本進入分頁或設定視窗。
- 右上角懸浮 Design version 選單可即時切換 V1 Independent Group Maps、V3 Map Setting Dialog、V4 Group Previews、V5 Microphone Setup；V3／V4／V5 Zone Map 視窗開啟時隱藏選單，關閉後恢復。版本編號沿用設計討論紀錄。
- 預覽初始進入 V5 原有的 Auto Mode Group／Channel 畫面，Manual Mode Settings 旁新增 Microphone Zones 上層頁籤。V3／V4／V5 的 Auto Mode 保留 Channel／Active Position 兩個子分頁。V4 的按鈕依序為 Channel Configure、Zone Map、Time，直接開啟 Group Previews 設定視窗，關閉後回到 Channel 並保留地圖設定。V3 Zone Map 入口位於 Channel Configure 的 Talker Position 設定內。V1 保留 Zone Map 子分頁。
- 版本選單沿用 S311／TR615 的緊湊選單形式，位於 Help／X 下方，不占用原有按鈕的位置。
- 同一個下拉選單可切換「使用者回饋與痛點」討論頁，列出 AVtech Media／Nathan 測試 MT500 V22 的完整英文原文、中文翻譯、痛點整理，以及客戶全域設定要求與 Jira 跨 Group 參照方案的差異。返回設計時保留目前版本、Group、分頁、搜尋及本次頁面的地圖設定。
- 回饋頁以獨立置中內容區呈現，隱藏產品導覽、Profile、模式分頁與 Help／Close，也不顯示返回按鈕；右上角保留下拉選單，直接切換回 V1、V3、V4、V5。
- V5 Microphone Setup 的 Microphone Zones 與 Auto Mode Settings、Manual Mode Settings 位於同一層。Auto Mode 保留 Output Layout、Group 清單、Channel 表格、Active Position、Channel Configure 與 Time；獨立的麥克風頁左側為麥克風選單與該設備搭配的攝影機 Group 縮圖，右側只保留 Zone Map 與 Zone settings。麥克風選單顯示 ID 與型號，記住各麥克風最後選取的 Group，包含停用組。Channel Group 與地圖編輯組分開選取；切換上層頁籤保留 Channel 搜尋、備註、原選取、麥克風選擇、地圖與視角。Channel Configure 的 Map Setting 仍以視窗開啟同一份 V5 地圖，縮圖留在視窗內；關閉返回原 Configure 並保留草稿，取消後內嵌地圖依已儲存模式判斷可否編輯。Group 開關在各入口同步，僅控制該組。切換麥克風、版本及回饋頁保留地圖資料。V5 的地圖、啟用狀態與 Pickup Mode 獨立於 V1、V3、V4；V5 Groups 與其他方案的選取也分開保存。V5 示範資料包含 MIC-01（G1～G3）與 MIC-02（G4、G5），均為 Shure MXA925-S，未連線到實際設備。
- V1：每個 Group 獨立編輯，其他 Group 的同 mic zones 作為只讀虛線參照。
- V3 沿用原設計流程：Channel Configure → Talker Position → Map Setting → Zone Map 視窗。視窗上方可切換 Group 與啟用狀態，當前組可直接編輯，其他組可作為彩色虛線參照；保留新增、刪除、四角縮放、手動座標與尺寸、重疊排斥、51 × 51 格平移與 25%～150% 縮放。各組與各方案的地圖資料獨立，關閉或切換後仍保留本次頁面的資料。
- V3 關閉地圖視窗後回到原本的 Channel Configure，保留尚未儲存的 Pickup Mode；在草稿中選 Talker Position 即可開啟 Map Setting，不會自動儲存模式。切換視窗內 Group 不改變原本 Configure 的 Group；其他組仍受已儲存的 Pickup Mode 與停用狀態限制。
- V4 Group Previews 從 Channel Configure 旁的 Zone Map 按鈕直接進入，Channel Configure 內仍保留 Map Setting 捷徑。開啟對象為來源 Group 搭配的麥克風，頂部固定顯示麥克風 ID 與型號；左側依 microphoneId 只列出同一台麥克風搭配的攝影機 Groups，預選來源 Group。點縮圖切換編輯組，主圖工具列標示當前 Group 與攝影機，右側保留 Zone settings；各組保留自己的 Zone 範圍。直接開啟使用來源 Group 已儲存的 Pickup Mode，非 Talker Position 的 Group 地圖維持反灰。各卡片提供獨立啟用開關，停用一組只停用該組主圖，其他縮圖仍可切換；移除 Group 下拉選單、頂部啟用開關及縮圖區小標題。左側獨立捲動，小螢幕改為橫向縮圖列。各縮圖以該麥克風的 Groups 計算相同原點與比例，包含麥克風、Zone 編號及各組固定顏色，停用組反灰。已提交的新增、刪除、位置與尺寸變更同步反映在縮圖中，關閉重開仍保留資料，V4 地圖資料與其他方案獨立保存。目前示範中的 G1、G2、G3 都搭配 MIC-01。
- 新版支援 Zone 新增、選取、刪除、拖曳、四角尺寸調整，以及 X／Y／Width／Height 手動輸入。四角把手拖曳時固定對角，尺寸與座標欄位同步更新。選取狀態以加粗亮色框線與較深填色呈現，點擊地圖空白處解除選取。
- 每個當前 Group 的 Zone 中心以虛線連接 mic，拖曳、調整尺寸或輸入數值時同步更新。
- 桌面版三個分頁共用可用畫面高度；Zone Map 背景容器內整合麥克風型號、Add Zone、Remove Zone 與 View Other Groups’ Zones 下拉選單，右側設定面板分開。麥克風 ID 標題、Map 狀態 Badge、Reference groups 標題、底部圖例與展示文字已移除。
- View Other Groups’ Zones 下拉清單可用 Checkbox 複選參照 Groups，預設全部不勾選；勾選立即顯示對應 Zones，取消即隱藏。清單超過可用高度時只在選單內捲動。
- 參考 Group 依 ID 使用固定顏色，選單色點與地圖虛線一致；G1 為橘色、G3 為紫色。當前 Group 的 Zone 保持藍色，重疊衝突使用紅色。
- 移除右側 Zone settings 的 Editable 字樣與分頁列右上方 Pickup Mode 文字，模式用途直接顯示在 Zone Map (Talker Position) 分頁名稱。較長分頁使用較寬區域，保留切換動畫。
- 當前 Group 的開關關閉時，該組的編輯地圖整體反灰並停用；重新開啟保留資料與視角，其他 Group 仍可切換查看。
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
