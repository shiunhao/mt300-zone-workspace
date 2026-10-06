import './UserFeedbackPage.css'

const customerFeedback = 'There is one other major thing I wanted to note here: I am using the Channel Configure -> Pickup Mode -> Talker Position -> Map Setting to set my mic coverage areas. And I really like that this is there. I don’t recall if this was in the prior version (if it was, I didn’t find it then), but I’m glad it’s here. That said, there are a few things which would make it better: For one, this needs to be a global setting per microphone. Not just to select between Lobes/Coverage Areas/Talker Position, but also the specific coverage zone map that you draw and configure. Users are not going to want to have to re-draw and manually re-update the zone map for every mic/camera group any time they need to make a change. And it could be really easy to make a mistake on one and have that cause problems later on where you don’t realize the coverage zone areas aren’t the same for the different groups. The next item is that trying to pull this up to visually debug what the system is doing takes too many clicks. And then that many more again if you need to exit one group’s coverage map and double-check that another’s is also correct. Additionally, it might be nice to give the user manual size/position controls for these coverage zones.'

const painPoints = [
  {
    title: '重複設定與維護',
    problem: '同一支麥克風，每個 Mic/Camera Group 都要各自畫圖、更新。',
    expectation: '希望以麥克風為單位共用設定，修改時不用逐一重做。',
  },
  {
    title: '設定不一致難以察覺',
    problem: '某個 Group 可能漏改或設定錯誤，當下卻沒有發現。',
    expectation: '不一致可能造成後續系統問題，需要容易檢查與比對。',
  },
  {
    title: '開啟地圖步驟太多',
    problem: '查看 Coverage Map、進行視覺化除錯，需要多次點擊。',
    expectation: '希望更快進入地圖查看設定。',
  },
  {
    title: '跨 Group 檢查繁瑣',
    problem: '檢查另一個 Group 時，需要退出目前地圖，再重新進入。',
    expectation: '希望能快速切換或直接比較不同 Group 的範圍。',
  },
  {
    title: '手動調整功能建議',
    problem: '希望能手動控制 Zone 的尺寸及位置。',
    expectation: '這是額外改善建議，原文語氣比前面的全域設定要求溫和。',
  },
]

export default function UserFeedbackPage({ onBack, returnLabel = '設計頁面', active = true }) {
  return (
    <section className="user-feedback-page" hidden={!active} aria-labelledby="user-feedback-title" lang="zh-Hant">
      <header className="user-feedback-page__header">
        <div>
          <p className="user-feedback-page__eyebrow">設計討論參考</p>
          <h1 id="user-feedback-title">使用者回饋與痛點</h1>
        </div>
        {onBack && (
          <button className="user-feedback-page__back" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span> 返回 {returnLabel}
          </button>
        )}
      </header>

      <div className="user-feedback-page__source">
        <p><span>Jira 議題</span><strong>CLONE - [Talker Position] Map Setting_able to cross review other groups&apos; same setting</strong></p>
        <p><span>回饋來源</span>美國 SI AVtech Media／Nathan <span className="user-feedback-page__source-divider" aria-hidden="true">·</span> 測試版本 MT500 V22</p>
      </div>

      <div className="user-feedback-page__columns">
        <article className="user-feedback-page__panel" aria-labelledby="user-feedback-original-title">
          <header className="user-feedback-page__panel-heading">
            <h2 id="user-feedback-original-title">完整使用者回饋</h2>
            <span>英文原文與中文翻譯</span>
          </header>
          <div className="user-feedback-page__scroll" tabIndex={0} role="region" aria-labelledby="user-feedback-original-title">
            <h3>英文原文</h3>
            <blockquote className="user-feedback-page__quote" lang="en">
              <p>{customerFeedback}</p>
            </blockquote>

            <div className="user-feedback-page__translation">
              <h3>中文完整翻譯</h3>
              <p>我目前透過「Channel Configure → Pickup Mode → Talker Position → Map Setting」設定麥克風的涵蓋範圍，而且很喜歡有這個功能。我不確定前一個版本是否已經有，如果有，我當時沒有找到。不過，還有幾個地方可以改善：</p>
              <p>首先，這應該是<strong>每支麥克風的全域設定</strong>。不只是 Lobes、Coverage Areas、Talker Position 的模式選擇，連實際繪製及設定的 Coverage Zone Map 也應該包含在內。</p>
              <p>使用者不會希望每次修改，都得為每個 Mic/Camera Group 重新畫圖、手動更新。而且其中某個 Group 很容易設定錯誤，直到後續發生問題，才發現不同 Group 的涵蓋範圍並不一致。</p>
              <p>另外，為了查看地圖、確認系統正在如何運作，需要點擊太多次。如果還要離開目前 Group 的地圖，再檢查另一個 Group 是否設定正確，又得重複許多操作。</p>
              <p>最後，如果能提供這些 Coverage Zone 的手動尺寸及位置調整功能，也會很有幫助。</p>
            </div>
          </div>
        </article>

        <article className="user-feedback-page__panel" aria-labelledby="user-feedback-pain-title">
          <header className="user-feedback-page__panel-heading">
            <h2 id="user-feedback-pain-title">痛點與需求整理</h2>
            <span>4 項痛點＋1 項建議</span>
          </header>
          <div className="user-feedback-page__scroll" tabIndex={0} role="region" aria-labelledby="user-feedback-pain-title">
            <ol className="user-feedback-page__pain-list">
              {painPoints.map((point, index) => (
                <li key={point.title}>
                  <div className="user-feedback-page__pain-heading">
                    <span className="user-feedback-page__number" aria-hidden="true">{index + 1}</span>
                    <h3>{point.title}</h3>
                  </div>
                  <p>{point.problem}</p>
                  <p className="user-feedback-page__expectation"><span>影響／期待</span>{point.expectation}</p>
                </li>
              ))}
            </ol>

            <section className="user-feedback-page__scope" aria-labelledby="user-feedback-scope-title">
              <h3 id="user-feedback-scope-title">客戶要求與 Jira 討論方案</h3>
              <table>
                <caption className="user-feedback-page__visually-hidden">客戶原始要求與 Jira 內部討論方案的差異</caption>
                <tbody>
                  <tr>
                    <th scope="row">客戶原始要求</th>
                    <td>每支麥克風的 Pickup Mode 與實際繪製的 Zone Map 都是全域設定，避免每個 Group 重複繪製與更新。</td>
                  </tr>
                  <tr>
                    <th scope="row">Jira 討論方案</th>
                    <td>在目前 Group 的 Map Setting 中，顯示同一支麥克風在其他 Group 已設定的 Zone，作為參考與比對。</td>
                  </tr>
                </tbody>
              </table>
              <blockquote className="user-feedback-page__jira-quote">
                <p>經討論，結合原本用戶測試與其環境設定，在 talker position/map setting 的地圖，新增一個畫面，以利用戶快速看到此 mic 在其他 group 已被設定的 zone，當做當下 group/zone 的參考。</p>
              </blockquote>
              <p className="user-feedback-page__gap"><strong>仍待解決的需求</strong>顯示其他 Group 的範圍，可以改善跨 Group 比對與錯誤察覺；但單靠這個功能，仍未完整解決重複維護，以及全域共用設定需求。</p>
            </section>
          </div>
        </article>
      </div>
    </section>
  )
}
