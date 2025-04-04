const xml2js = require('xml2js');
const crypto = require('crypto');
const wxPayConfig = {
    appid: 'wx4fca4bfde91470b0',
    mchid: '1709389140',
    key: '65kvCnM9SgFiPV6XDxOJyAJln8XCdScD',  // 请替换为真实API密钥
    notifyUrl: 'http://154.201.65.119:3000/wechat/notify',
};

export async function createOrder({name, out_trade_no, total, openid,cb}) {
    try {
        const params = {
            appid: wxPayConfig.appid,
            mch_id: wxPayConfig.mchid,
            nonce_str: generateNonceStr(),
            body: name,
            out_trade_no:out_trade_no,        // 改为字符串类型
            total_fee: 1,
            notify_url: cb,
            trade_type: 'JSAPI',
            openid: openid,
        };
        params['sign'] = generateSign(params, wxPayConfig.key);
        const builder = new xml2js.Builder({headless: true});
        const xmlData = builder.buildObject({xml: params});
        const rsp = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
            method: 'POST',
            headers: {'Content-Type': 'application/xml'},
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
            provider: 'wxpay',
            nonceStr: nonceStr,
            prepay_id:prepayId,
            package: packageValue,
            signType: signType,
            paySign: paySign,
            timeStamp: timeStamp  // Uniapp需要此参数，尽管示例未显示
        };
        return uniappParams;
    } catch (error) {
        console.error('请求失败:', error);
        throw error;
    }
}


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

export async function parseXml(xml) {
    const isValid = await verifyV2Callback(xml);
    if (!isValid) {
        console.log(' 签名验证失败');
        return new Response(
            '<xml><return_code><![CDATA[FAIL]]></return_code></xml>',
            {headers: {'Content-Type': 'application/xml'}}
        );
    }
    // 解析业务数据
    const parser = new xml2js.Parser({explicitArray: false});
    const {xml: data} = await parser.parseStringPromise(xml);
    if (data.result_code !== 'SUCCESS') {
        console.log(' 业务错误:', data);
        return new Response(
            '<xml><return_code><![CDATA[FAIL]]></return_code></xml>',
            {headers: {'Content-Type': 'application/xml'}}
        );
    }
    return data
}
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
    const stringSignTemp = stringA + `&key=${wxPayConfig.key}`;

    // 4. MD5签名
    return crypto.createHash('md5')
        .update(stringSignTemp, 'utf8')
        .digest('hex')
        .toUpperCase();
}
