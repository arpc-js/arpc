let db = null
//懒加载vite rpc也是node，不能加载，前端和vite-node都不能加载
function getDB() {
    if (!db){
        const { Database } = require("bun:sqlite");
        db = new Database("db.sqlite");
    }
    return db
}
let rsp=getDB().run(`
            CREATE TABLE IF NOT EXISTS User (
                id           INTEGER       PRIMARY KEY AUTOINCREMENT,
                openid       TEXT          UNIQUE,
                name         TEXT          NOT NULL,
                type         INTEGER       NOT NULL DEFAULT 0 CHECK (type IN (0, 1, 2)),
                pwd          TEXT          NOT NULL,
                info         TEXT          NOT NULL,
                phone        TEXT          UNIQUE,
                age          INTEGER       CHECK (age > 0),
                avatar       TEXT,
                created_at   TEXT          NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
                updated_at   TEXT          NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
                );
        `)
console.log(rsp)
