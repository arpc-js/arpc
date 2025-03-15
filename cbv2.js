import crypto from 'crypto';
const xml2js = require('xml2js');
const wxPayConfig = {
    appId: 'wx4fca4bfde91470b0',
    mchId: '1709389140',
    apiKey: '65kvCnM9SgFiPV6XDxOJyAJln8XCdScD'
};

const server = Bun.serve({
    port: 3000,
    async fetch(request) {
        if (request.method === 'POST' && new URL(request.url).pathname === '/wechat/notify') {
            try {
                // 处理XML请求体
                const xmlBody = await request.text();
                // 验证签名
                const isValid = await verifyV2Callback(xmlBody);
                if (!isValid) {
                    console.log(' 签名验证失败');
                    return new Response(
                        '<xml><return_code><![CDATA[FAIL]]></return_code></xml>',
                        {headers: {'Content-Type': 'application/xml'}}
                    );
                }
                // 解析业务数据
                const parser = new xml2js.Parser({explicitArray: false});
                const {xml: data} = await parser.parseStringPromise(xmlBody);
                if (data.result_code !== 'SUCCESS') {
                    console.log(' 业务错误:', data);
                    return new Response(
                        '<xml><return_code><![CDATA[FAIL]]></return_code></xml>',
                        {headers: {'Content-Type': 'application/xml'}}
                    );
                }
                // 处理订单逻辑
                console.log(' 校验成功，更新数据库:', data);
                // 返回成功响应
                return new Response(
                    '<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>',
                    {headers: {'Content-Type': 'application/xml'}}
                );
            } catch (error) {
                console.error(' 回调处理异常:', error);
                return new Response(
                    '<xml><return_code><![CDATA[FAIL]]></return_code></xml>',
                    {
                        status: 500,
                        headers: {'Content-Type': 'application/xml'}
                    }
                );
            }
        }
        return new Response('Not Found', {status: 404});
    }
});

console.log(`Server  running at ${server.hostname}:${server.port}`);


// 配置参数


// 生成V2签名
function generateV2Sign(params) {
    // 1. 过滤空值并排序
    const sortedParams = Object.keys(params)
        .filter(key => key !== 'sign' && params[key] !== '' && params[key] !== undefined)
        .sort();

    // 2. 拼接键值对
    const stringA = sortedParams
        .map(key => `${key}=${params[key]}`)
        .join('&');

    // 3. 拼接API密钥
    const stringSignTemp = stringA + `&key=${wxPayConfig.apiKey}`;

    // 4. MD5签名
    return crypto.createHash('md5')
        .update(stringSignTemp, 'utf8')
        .digest('hex')
        .toUpperCase();
}

// 验证回调签名
async function verifyV2Callback(xmlData) {
    // 解析XML
    const parser = new xml2js.Parser({explicitArray: false});
    const result = await parser.parseStringPromise(xmlData);
    const params = result.xml;

    // 获取原签名
    const originalSign = params.sign;
    delete params.sign;

    // 生成新签名
    const newSign = generateV2Sign(params);

    return originalSign === newSign;
}
