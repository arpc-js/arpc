const NodeMediaServer = require('node-media-server');
const config = {
    rtmp: {
        port: 1935,  // RTMP 推流端口
        chunk_size: 100,
    },
    http: {
        port: 8000,  // HTTP 管理端口
        mediaroot: "./media",  // 媒体文件存储路径（HLS/DASH 必需）
        allow_origin: "*"
    }
};
const nms = new NodeMediaServer(config);
nms.run();
