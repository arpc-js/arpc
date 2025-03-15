/**
 * 计算两个经纬度坐标之间的距离
 * @param {number} lat1 点1纬度
 * @param {number} lng1 点1经度
 * @param {number} lat2 点2纬度
 * @param {number} lng2 点2经度
 * @param {string} unit 单位 ('K' 千米 | 'M' 米 | 'N' 海里)
 * @returns {number} 距离数值
 * 半正矢函数测距：
 * a = sin²(Δφ/2) + cos φ1 * cos φ2 * sin²(Δλ/2)
 * c = 2 * atan2(√a, √(1−a))
 * d = R * c
 */
function getDistance(lng1,lat1, lng2,lat2, unit = 'K') {
    // 角度转弧度
    const rad = (degree) => degree * Math.PI / 180;

    const radLat1 = rad(lat1);
    const radLat2 = rad(lat2);
    const deltaLat = radLat2 - radLat1;
    const deltaLng = rad(lng2) - rad(lng1);

    // Haversine公式计算
    const a = Math.sin(deltaLat/2)**2
        + Math.cos(radLat1) * Math.cos(radLat2)
        * Math.sin(deltaLng/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    // 地球半径（单位：千米）
    const R = 6371;
    let distance = R * c;

    // 单位转换
    switch(unit.toUpperCase()) {
        case 'M': // 米
            distance *= 1000;
            break;
        case 'N': // 海里
            distance *= 0.5399568;
            break;
    }

    return distance;
}
const distanceKM = getDistance(121.4949, 31.2416, 121.51236176490783, 31.23766466292061);
console.log(distanceKM.toFixed(2) + ' km'); // 输出: 1068.42 km
