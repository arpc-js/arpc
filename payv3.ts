const crypto = require('crypto');
const fs = require('fs');
// 配置参数（替换为真实信息）
const wxPayConfig = {
    appid: 'wx4fca4bfde91470b0',
    mchid: '1709389140',
    serial_no: '6EECAD79BE188B4AC84211FA65254198BBB4DE8D', // 商户证书序列号
    privateKey : fs.readFileSync('./apiclient_key.pem',  'utf8'),
    notifyUrl: 'http://154.201.65.119:3000/wechat/notify'
};

// 生成随机字符串（修正：更安全的长度）
function generateNonceStr() {
    return crypto.randomBytes(16).toString('hex');
}

// 生成V3签名（修正：标准化URL和空body处理）
function generateSignature(method, url, timestamp, nonceStr, body) {
    const normalizedUrl = url.replace(/\/+$/,  ''); // 移除末尾斜杠
    const bodyStr = body ? JSON.stringify(body)  : '';
    const signStr = `${method}\n${normalizedUrl}\n${timestamp}\n${nonceStr}\n${bodyStr}\n`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signStr);
    return signer.sign(wxPayConfig.privateKey,  'base64');
}

// 构造认证头（新增：自动处理空body）
function buildAuth(method, url, body = null) {
    const nonceStr = generateNonceStr();
    const timestamp = Math.floor(Date.now()  / 1000);
    const signature = generateSignature(method, url, timestamp, nonceStr, body);

    return `WECHATPAY2-SHA256-RSA2048 ` +
        `mchid="${wxPayConfig.mchid}",`  +
        `nonce_str="${nonceStr}",` +
        `timestamp="${timestamp}",` +
        `serial_no="${wxPayConfig.serial_no}",`  +
        `signature="${signature}"`;
}

// 创建支付订单（修正：签名参数排序）
async function createOrder() {
    try {
        const params = {
            appid: wxPayConfig.appid,
            mchid: wxPayConfig.mchid,
            description: '商品描述',
            out_trade_no: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2,  5)}`,
            notify_url: wxPayConfig.notifyUrl,
            amount: {
                total: 1,
                currency: 'CNY'
            },
            payer: {
                openid: 'oUotf7Fjf3ZSJ9x1_0MjsLOd-ib4'
            }
        };

        const method = 'POST';
        const apiPath = '/v3/pay/transactions/jsapi';

        // 发送请求
        const response = await fetch(`https://api.mch.weixin.qq.com${apiPath}`,  {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': buildAuth(method, apiPath, params),
                'User-Agent': 'WechatPay/1.0'
            },
            body: JSON.stringify(params)
        });

        // 错误处理（新增：详细错误日志）
        if (!response.ok)  {
            const error = await response.json();
            console.error(' 微信返回错误:', error);
            throw new Error(`[${error.code}]  ${error.message}`);
        }

        const result = await response.json();

        // 生成客户端支付参数（修正：签名参数排序）
        const payParams = {
            appId: wxPayConfig.appid,
            timeStamp: Math.floor(Date.now()  / 1000).toString(),
            nonceStr: generateNonceStr(),
            package: `prepay_id=${result.prepay_id}`,
        };


        return await paySign(result.prepay_id);
    } catch (error) {
        console.error(' 订单创建失败:', error);
        throw error;
    }
}
async function paySign(prepay_id) {
    let timeStamp = (Math.floor(new Date().getTime() / 1000)).toString();
    let nonceStr = generateNonceStr(32);
    let signStr = `${wxPayConfig.appid}\n${timeStamp}\n${nonceStr}\nprepay_id=${prepay_id}\n`;
    let sign = crypto.createSign("RSA-SHA256");
    sign.update(signStr);
    return {
        paySign: sign.sign(wxPayConfig.privateKey, "base64"),
        timeStamp: timeStamp,
        nonceStr: nonceStr,
        signType: 'RSA',
        package: 'prepay_id=' + prepay_id
    };
}

let order=await createOrder()
console.log(order)
