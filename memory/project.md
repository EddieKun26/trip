# 專案概要

## 產品

可建立及加入多個旅程的家庭／小團體旅行規劃 Web App，優先為 iPhone 15 Pro 尺寸設計。

## 使用情境

- 既有東京旅程日期：9/20–9/26。
- 使用者可另外建立任意目的地、日期與航班的空白旅程。
- 家庭成員共同收藏、投票及安排行程。
- 公開訪客可以閱覽，但不能新增、投票或修改。

## 正式環境

- 正式網址：https://trip-eddie23.vercel.app
- GitHub：EddieKun26/trip，正式分支 `main`。
- 部署：Vercel。
- 共用資料：Vercel Marketplace Upstash Redis。
- 地點資料及照片：Google Places API；金鑰只放在伺服器環境變數。

## 本機目錄

- 主要工作目錄：`travel-app/prototype`。
- `trip-deploy` 是 GitHub 同步與部署用的本機副本，不是主要編輯來源。
