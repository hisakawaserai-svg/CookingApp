// 初期のみ記憶テーブル作成
import { open } from '@op-engineering/op-sqlite'

// DB(データベース)を開く
export const db = open({ name: 'shopping.db' })

// テーブル作成
export const initDB = () => {
    try {
        /* recipesテーブル作成
            id: id
            dishName: 料理名
            servings: 基準の数 例：基準：2人前 -> 現在：4人前　+/-ボタンで変更用
            servingsUnit: 基準の単位 例：単位（"人前", "個分", "台分"）
            customServingsUnit: servingsUnitが"その他"の場合、作成する単位
        */
        db.execute(`
            CREATE TABLE IF NOT EXISTS recipes (
                id TEXT PRIMARY KEY,
                dishName TEXT NOT NULL,
                servings REAL,
                servingsUnit TEXT,
                customServingsUnit TEXT
            )
        `)

        // ingredientsテーブル作成
        db.execute(`
            CREATE TABLE IF NOT EXISTS ingredients (
                id TEXT PRIMARY KEY,
                recipeId TEXT NOT NULL,
                name TEXT NOT NULL,
                num REAL,
                unit TEXT NOT NULL,
                customUnit TEXT,
                FOREIGN KEY (recipeId) REFERENCES recipes(id)
                ON DELETE CASCADE
            )
        `)

        // stepsテーブル作成
        db.execute(`
            CREATE TABLE IF NOT EXISTS steps (
                id TEXT PRIMARY KEY,
                recipeId TEXT NOT NULL,
                type TEXT NOT NULL,
                text TEXT NOT NULL, 
                timer INTEGER, 
                stepOrder INTEGER NOT NULL,
                FOREIGN KEY (recipeId) REFERENCES recipes(id)
                ON DELETE CASCADE
            )
        `)

        // tagsテーブル作成
        db.execute(`
            CREATE TABLE IF NOT EXISTS tags (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                tagColor TEXT NOT NULL
            )
        `)
        // tag関連テーブル
        db.execute(`
            CREATE TABLE IF NOT EXISTS recipeTags (
                recipeId TEXT NOT NULL,
                tagId TEXT NOT NULL,
                PRIMARY KEY (recipeId, tagId),
                FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE,
                FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
            )
        `)
    } catch (error) {
        console.error(`DB初期化エラー：${error}`)
    }
}