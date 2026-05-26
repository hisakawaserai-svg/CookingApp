# CookingApp (AIレシピインポート & 調理サポートアプリ)

Web上のテキストやメモ書きなどの「非構造化データ」から、Gemini APIを用いてレシピの「材料」や「調理手順」を自動解析・構造化し、スムーズな調理をサポートするReact Native（TypeScript）製アプリです。

## 📱 アプリのデモ・スクリーン画面
| ① レシピ一覧（タグ検索） | ② AIによる自動解析 | ③ 解析データの手直し | ④ ステップ調理画面 |
| :---: | :---: | :---: | :---: |
| <img width="200" alt="レシピ一覧" src="https://github.com/user-attachments/assets/89ef22d8-f054-4972-9875-750e83f56720" /> | <img width="200" alt="AIによる解析" src="https://github.com/user-attachments/assets/692c4395-ccde-4bbf-8544-7847dae729c9" /> | <img width="200" alt="解析データの手直し" src="https://github.com/user-attachments/assets/d55e7c49-da49-47bb-b6fb-a03a87387983" /> | <img width="200" alt="ステップ調理画面" src="https://github.com/user-attachments/assets/7d4fad59-a00a-4ceb-895d-d4218eed65a1" /> |

<details>
<summary><b>💡 さらに料理が快適になるこだわり機能（クリックで展開）</b></summary>

### 1. 人数・個数に応じた「材料の自動倍量計算」
調理する個数を変更すると、それに合わせて必要な材料の分量が計算されます。
ユーザーが手元で計算する手間を減らすための工夫です。
<br>

https://github.com/user-attachments/assets/bf5f787e-da47-4fec-8025-79e4a1f4867a

### 2. 振動または画面で確認できる「ステップタイマー」
「5分煮込む」などの工程において、調理画面から離れずにその場でタイマーを起動できます。
<br>

https://github.com/user-attachments/assets/9eb9e77d-4b26-43ad-8551-b91e3ea1a90b

</details>

## ✨ アプリの特徴
- **AIによるレシピの構造化**: 
  ネットの料理メモや箇条書きテキストをペーストするだけで、AI（Gemini API）が「料理名」「材料」「前処理」「調理手順」に自動で切り分けて保存します。
- **手動での手直し機能**: 
  AIの解析ミスや自分好みの調整に対応できるよう、すべての項目を後から手動で編集・修正できます。
- **スマートな調理サポート**:
  登録したレシピの調理手順（前処理・本調理）をステップごとに確認しながら快適に料理ができます。
- **文字 ＆ タグによるフィルター**:
  フリーワード検索や、自分で作成したカスタムタグを使って、保存したレシピをサクッと絞り込めます。

## 🛠️ 使用技術
- **フロントエンド**: React Native (TypeScript)
- **データベース**: SQLite
- **AI連携**: Gemini API
