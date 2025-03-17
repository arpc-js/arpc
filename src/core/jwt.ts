
export class Auth {
    key:string
    constructor(key:string) {
        this.key=key
    }
    sign(payload: Bun.BlobOrStringOrBuffer) {
        //Config.get('AWS_SECRET_ACCESS_KEY')
        const hasher = new Bun.CryptoHasher("sha256", this.key);
        hasher.update(payload);
        return hasher.digest('base64');
    }
    getJWT(payload): string {
        const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
        const base64Header = Buffer.from(header).toString('base64');
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

        const signature = this.sign(`${base64Header}.${base64Payload}`);
        return `${base64Header}.${base64Payload}.${signature}`;
    }
    getUserJWT(uid:any,permissions=['*'],exp=0): string {
        const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
        const payload = {
            uid,
            permissions,
        }
        if (exp!=0){
            payload['exp']=Math.floor(Date.now() / 1000)+exp
        }
        const base64Header = Buffer.from(header).toString('base64');
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

        const signature = this.sign(`${base64Header}.${base64Payload}`);
        return `${base64Header}.${base64Payload}.${signature}`;
    }

    //jwt校验成功才能返回用户数据
    //否则抛出异常
    async verifyJWT(token: string) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('err sytax');
        }
        const [header, payload, signature] = parts;
        const expectedSignature = this.sign(`${header}.${payload}`);
        //验签 Handle potential "=" padding in base64 signatures
        if (signature.replace(/=+$/, '') !== expectedSignature.replace(/=+$/, '')) {
            throw new Error('invalid token');
        }
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
        if (decodedPayload.exp&&decodedPayload.exp < Math.floor(Date.now() / 1000)) {
            throw new Error('403 expired');
        }
        return decodedPayload;
    }
}
/*
let token=new Auth('asfdsf').getUserJWT(1)
console.log(token)
console.log(new Auth('asfdsf').verifyJWT(token))
*/
