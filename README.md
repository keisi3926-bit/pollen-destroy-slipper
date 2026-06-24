# 花粉滅殺スリッパー！

King of Slipper 外伝ミニゲームとして作った、縦スクロール弾幕シューティングのMVPです。

## 概要

- プレイヤーはスリッパを操り、花粉の雑魚敵と一面ボス「スギノミコト」を撃破します。
- PCとスマホの両方で遊べます。
- 画像素材なしでも動くように、Canvas図形とCSS/テキスト演出で構成しています。
- 後から `assets/characters/` に立ち絵画像を置くだけで会話演出を差し替えられます。

## 操作

PC:

- 移動: 矢印キー / WASD
- 低速移動: Shift
- ショット: Z / Space
- 履技: X
- 会話送り: クリック / タップ / Z
- 会話スキップ: Enter

スマホ:

- 移動: 画面ドラッグ
- ショット: 自動
- 低速移動: 右下の `低速` ボタン
- 履技: 右下の `履技` ボタン
- ポーズ: 画面上部の `MENU` ボタン
- 更新情報: スマホでは初期状態で `INFO` に折りたたみ

Xboxコントローラー:

- 移動: 左スティック / D-pad
- ショット・決定: A
- 履技: X
- 低速移動: LB / RB / LT / RT
- ポーズ: Menu
- 戻る・会話スキップ: B

## 実装内容

- 一面道中
- ボス「スギノミコト」
- ビジュアルノベル風会話システム
- PLAYER立ち絵/自機画像 `assets/characters/player.png` 対応
- スギノミコト立ち絵/ボス画像 `assets/characters/suginomikoto.png` 対応
- 大・中・小花粉スプライト `assets/enemies/pollen_enemies.png` 対応
- 背景画像 `assets/backgrounds/stage1_pollen_sando.png` 対応
- 道中BGM `assets/audio/stage1_spring_pollen_path.mp3` 対応
- ボスBGM `assets/audio/boss_suginomikoto.mp3` 対応
- 主人公の極履技「スリッパ・ノヴァ」
- 履力アイテム（小P・大P）と最大4足の追従支援機「随履」
- 随履の通常追従、低速固定陣形、同期射撃、スリッパ・ノヴァ連携光線
- POWER段階に応じた本体ショット本数・太さ・色・威力の強化
- Pアイテム取得演出、POWERゲージ、取得効果音接続用フック
- ボス神威進行
- 残機制、難易度選択、途中復帰
- スコア、エクステンド、難易度別ハイスコア保存
- ポーズメニュー、ゲームオーバーメニュー
- F3デバッグ表示（敵数、敵弾数、直近1秒の生成弾数、ウェーブ、攻撃パターン）
- 更新情報パネル
- `version.json` によるアップデート情報管理
- `sw.js` によるService Workerキャッシュ更新

## 進行システム

- 初期残機は3機です。
- 被弾すると残機を1つ失い、敵弾が消去され、履技が3回まで補充された状態で短時間無敵復帰します。
- 残機が0になるとゲームオーバーメニューが開きます。
- `CONTINUE` は最後に到達したチェックポイントから再開します。
- コンティニュー時はスコアが20%減少し、コンティニュー回数が記録されます。
- スコアが `30000 / 80000 / 150000` に到達すると残機が1つ増えます。
- 花粉撃破で履力アイテムが出現し、履力段階に応じて随履が最大4足まで増えます。
- 被弾時は履力を5失い、随履を1段階分失います。

## 難易度

タイトル画面の `DIFFICULTY` で切り替えます。

- `EASY`: 弾速と弾数を抑え、ボス到達を優先
- `NORMAL`: 一面として遊びやすい標準設定
- `HARD`: 弾幕量とボスHPを増やした挑戦用

## ファイル構成

```text
index.html
style.css
game.js
version.json
sw.js
assets/
  backgrounds/
    stage1_pollen_sando.png
  audio/
    stage1_spring_pollen_path.mp3
    boss_suginomikoto.mp3
  characters/
    player.png
    suginomikoto.png
    .gitkeep
  enemies/
    pollen_enemies.png
```

## 更新管理

サイトトップの更新パネルは `version.json` を読み込みます。

バージョン更新時は次を変更してください。

1. `version.json` の `version` と `updates`
2. `sw.js` の `CACHE_VERSION`

Service Worker対応環境では、更新検知後に「更新して再読込」ボタンで新しいキャッシュを適用できます。

背景や古いUIが残る場合は、更新パネルの「更新確認」後に「キャッシュ更新して再読込」を押してください。

## ローカル実行

静的ファイルなので `index.html` を直接開いて動作確認できます。

Service Worker更新機能まで確認する場合は、ローカルサーバーで起動してください。

```bash
python -m http.server 8000
```

その後、ブラウザで `http://localhost:8000/` を開きます。
