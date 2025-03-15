const crypto = require('crypto');
const fs = require('fs');
Bun.serve({
    // `routes` requires Bun v1.2.3+
    port:3000,
    async fetch(req:Request) {
        try {
            console.log(req.headers)
            let params=await req.json()
            console.log(params)
            let data=await handleWechatNotify(req.headers,params)
            console.log('data:',data)
        }catch (e) {
            console.log('catch')
        }
        return new Response("err", {status: 500});
    }
});
async function handleWechatNotify(headers, body) {
    try {
        // 1. 验证签名 --------------------------
        const signature = headers['wechatpay-signature'];
        const serialNo = headers['wechatpay-serial'];
        const nonce = headers['wechatpay-nonce'];
        const timestamp = headers['wechatpay-timestamp'];

        // 获取对应的平台证书,公钥
        const publicKey = fs.readFileSync('./pub_key.pem',  'utf8');

        // 构造验签串
        const signStr = `${timestamp}\n${nonce}\n${body}\n`;

        // 验证签名
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(signStr);
        const isValid = verify.verify(
            publicKey,
            signature,
            'base64'
        );

        if (!isValid) {
            throw new Error('签名验证失败');
        }

        // 2. 解密数据 --------------------------
        const result = JSON.parse(body);
        const { ciphertext, nonce: aesNonce, associated_data } = result.resource;

        // 解密参数处理
        const key = Buffer.from('kBukvxl8oI4rHde9ZZvO8bUMu2KDBp6S', 'utf8');
        const authTag = ciphertext.slice(-16);
        const encryptedData = ciphertext.slice(0, -16);

        // AES-GCM解密
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            key,
            Buffer.from(aesNonce, 'base64')
        );
        decipher.setAuthTag(Buffer.from(authTag, 'base64'));
        decipher.setAAD(Buffer.from(associated_data, 'utf8'));

        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    } catch (error) {
        console.error('回调处理失败:', error,error.stack,error.message);
        throw error;
    }
}
