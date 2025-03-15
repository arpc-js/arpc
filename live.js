const NodeMediaServer = require('node-media-server');
const config = {
    rtmp: {
        port: 1935, // 推流端口
        chunk_size: 60000,
        gop_cache: true
    },
    http: {
        port: 8000, // 拉流/管理端口
        allow_origin: '*' // 解决跨域问题
    }
};
const nms = new NodeMediaServer(config);
nms.run();
