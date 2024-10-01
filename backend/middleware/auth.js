const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const request = require('request');
require('dotenv').config();

// Cognito 配置
const poolData = {
    UserPoolId: process.env.USER_POOL_ID,
    Region: process.env.REGION
};
const jwkUrl = `https://cognito-idp.${poolData.Region}.amazonaws.com/${poolData.UserPoolId}/.well-known/jwks.json`;
let pems;

// 获取 JWK 并转换为 PEM
request({ url: jwkUrl, json: true }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
        pems = {};
        body.keys.forEach(key => {
            const key_id = key.kid;
            const modulus = key.n;
            const exponent = key.e;
            const key_type = key.kty;
            const jwk = { kty: key_type, n: modulus, e: exponent };
            const pem = jwkToPem(jwk);
            pems[key_id] = pem;
        });
    } else {
        console.error("获取 JWK 时出错");
    }
});

// 验证 JWT 令牌的中间件
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).send('访问被拒绝');

    const decodedJwt = jwt.decode(token, { complete: true });
    if (!decodedJwt) {
        return res.status(401).send('无效的令牌');
    }
    const kid = decodedJwt.header.kid;
    const pem = pems[kid];
    if (!pem) {
        return res.status(401).send('无效的令牌');
    }
    jwt.verify(token, pem, (err, payload) => {
        if (err) {
            return res.status(401).send('无效的令牌');
        } else {
            req.user = payload;
            next();
        }
    });
}

module.exports = {
    verifyToken
};