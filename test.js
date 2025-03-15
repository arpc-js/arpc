const xml2js = require('xml2js');
const crypto = require('crypto');

const wxPayConfig = {
    appid: 'wx4fca4bfde91470b0',
    mchid: '1709389140',

    key: '65kvCnM9SgFiPV6XDxOJyAJln8XCdScD',  // 请替换为真实API密钥
    notifyUrl: 'http://154.201.65.119:3000/wechat/notify',
};

// 构建微信支付请求参数（确保字符串类型）
const params = {
    appid: wxPayConfig.appid,
    mch_id: wxPayConfig.mchid,
    nonce_str: generateNonceStr(),
    body: '古法香蕉',
    out_trade_no: '21',        // 改为字符串类型
    total_fee: '1',            // 改为字符串类型
    spbill_create_ip: '123.12.12.123',
    notify_url: wxPayConfig.notifyUrl,
    trade_type: 'JSAPI',
    openid: 'oUotf7Fjf3ZSJ9x1_0MjsLOd-ib4',
};

// 生成签名并添加到参数
params.sign = generateSign(params, wxPayConfig.key);

// 构建XML请求体
const builder = new xml2js.Builder({ headless: true });
const xmlData = builder.buildObject({ xml: params });

// 发送支付请求
async function createOrder() {
    try {
        const rsp = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/xml' },
            body: xmlData  // 直接使用XML字符串
        });

        const responseXml = await rsp.text();

        // 解析XML响应
        const parser = new xml2js.Parser({
            explicitArray: false,
            trim: true,
            explicitRoot: false
        });

        const result = await parser.parseStringPromise(responseXml);

        // 验证返回签名（可选）
        const returnSign = result.sign;
        delete result.sign;
        const calSign = generateSign(result, wxPayConfig.key);

        // 添加验证结果到返回对象
        result.sign_match = returnSign === calSign;

        // 输出JSON格式结果
        console.log(JSON.stringify({
            status: rsp.status,
            data: result,
            verified: result.sign_match
        }, null, 2));

        // 构造Uniapp支付参数
        const prepayId = result.prepay_id;
        const packageValue = `prepay_id=${prepayId}`;
        const nonceStr = generateNonceStr();
        const timeStamp = Math.floor(Date.now() / 1000).toString();
        const signType = 'MD5';

        // 生成支付签名
        const payParams = {
            appId: wxPayConfig.appid,
            timeStamp: timeStamp,
            nonceStr: nonceStr,
            package: packageValue,
            signType: signType
        };
        //二次签名
        //通过参数排序。参数+私钥的摘要签名
        const paySign = generateSign(payParams, wxPayConfig.key);

        //返回Uniapp需要的参数结构
        const uniappParams = {
            nonceStr: nonceStr,
            package: packageValue,
            signType: signType,
            paySign: paySign,
            timeStamp: timeStamp  // Uniapp需要此参数，尽管示例未显示
        };

        console.log('Uniapp支付参数:', JSON.stringify(uniappParams, null, 2));
        return uniappParams;
    } catch (error) {
        console.error('请求失败:', error);
        throw error;
    }
}

createOrder();

// 生成随机字符串
function generateNonceStr() {
    return crypto.randomBytes(16).toString('hex').substr(0, 32);
}

// 生成微信支付签名
function generateSign(params, apiKey) {
    // 过滤空值并排序
    const sortedParams = Object.keys(params)
        .filter(key => key !== 'sign' && params[key] !== undefined && params[key] !== '')
        .sort()
        .reduce((acc, key) => {
            acc[key] = params[key];
            return acc;
        }, {});

    // 拼接签名字符串
    const stringA = Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    const stringSignTemp = stringA + `&key=${apiKey}`;

    // 计算MD5签名
    return crypto.createHash('md5')
        .update(stringSignTemp, 'utf8')
        .digest('hex')
        .toUpperCase();
}
