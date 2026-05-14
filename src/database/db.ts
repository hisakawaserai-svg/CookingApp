// 初期のみ記憶テーブル作成
import { open } from '@op-engineering/op-sqlite'

// DB(データベース)を開く
export const db = open({ name: 'shopping.db' })

// テーブル作成
export const initDB = () => {
    try {
        // recipesテーブル作成
        db.execute(`
            CREATE TABLE IF NOT EXISTS recipes (
                id TEXT PRIMARY KEY,
                dishName TEXT NOT NULL
            )
        `)

        // ingredientsテーブル作成
        db.execute(`
            CREATE TABLE IF NOT EXISTS ingredients (
                id TEXT PRIMARY KEY,
                recipeId TEXT NOT NULL,
                name TEXT NOT NULL,
                num INTEGER,
                unit TEXT NOT NULL,
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
    } catch (error) {
        console.error(`DB初期化エラー：${error}`)
    }
}