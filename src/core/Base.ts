let db = null
//懒加载vite rpc也是node，不能加载，前端和vite-node都不能加载
function getDB() {
    if (!db){
        const { Database } = require("bun:sqlite");
        db = new Database("db.sqlite");
    }
    return db
}
/*conn.run("CREATE TABLE user (id INTEGER PRIMARY KEY, name CHAR(50),age INTEGER)");

const query = conn.query("INSERT INTO user VALUES (1,'zs',18)").run();*/
export class Base<T> {
    // @ts-ignore
    constructor() {
    }
    // @ts-ignore
    static filter(...keys: ((keyof T)|{})[]){

    }
    add(){


        let v=Object.keys(this).map(x=>'?').join(',')
        getDB().prepare(`INSERT INTO ${this.constructor.name} VALUES (${v})`).run(...Object.values(this))
    }
    addone(){
        let v=Object.keys(this).map(x=>'?').join(',')
        getDB().prepare(`INSERT INTO ${this.constructor.name} VALUES (${v})`).run(...Object.values(this))
    }
    del(sqlParts: TemplateStringsArray, ...params: any[]) {
        let pre= `delete  FROM ${this.constructor.name} WHERE `+sqlParts.reduce((acc, part, i) =>
                    acc + part + (i < params.length ? "?" : ""), "")
        console.log(pre)
        console.log(params)
        return  getDB().prepare(pre).run(...params);
    }
    update(sqlParts: TemplateStringsArray, ...params: any[]) {
        let set=Object.keys(this).map(k=>`${k}=?`).join(',')
        let pre= `UPDATE ${this.constructor.name} set ${set} WHERE `+sqlParts.reduce((acc, part, i) => acc + part + (i < params.length ? "?" : ""), "")
        params=[...Object.values(this), ...params]
        console.log(pre)
        console.log(params)
        return  getDB().prepare(pre).run(...params);
    }
    gets(sqlParts: TemplateStringsArray, ...params: any[]) {
        let pre=
            // 正确拼接占位符
            `SELECT * FROM ${this.constructor.name} WHERE `+sqlParts.reduce((acc, part, i) =>
                    acc + part + (i < params.length ? "?" : ""),
                "")
        console.log(pre)
        console.log(params)
        return  getDB().prepare(pre).all(...params);
    }
    get(sqlParts: TemplateStringsArray, ...params: any[]) {
        let pre=
            // 正确拼接占位符
            `SELECT * FROM ${this.constructor.name} WHERE `+sqlParts.reduce((acc, part, i) =>
                    acc + part + (i < params.length ? "?" : ""),
                "")
        console.log(pre)
        console.log(params)
        return  getDB().prepare(pre).get(...params);
    }
     static get(sqlParts: TemplateStringsArray, ...params: any[]) {
        return  getDB().prepare(
            // 正确拼接占位符
            `SELECT * FROM ${this.name} WHERE `+sqlParts.reduce((acc, part, i) =>
                    acc + part + (i < params.length ? "?" : ""),
                "")
        ).get(...params);
    }
    static test(sqlParts: TemplateStringsArray, ...params: any[]) {
        sqlParts.forEach((value, index) => console.log(value))
        return  `SELECT * FROM ${this.name} WHERE `+sqlParts.reduce((acc, part, i) =>
                acc + part + (i < params.length ? "?" : ""),
            "")
    }
}
