const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
require('dotenv').config();

// AWS 配置
AWS.config.update({ region: process.env.REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient();

// 导入验证中间件
const { verifyToken } = require('../middleware/auth');

// 下订单
router.post('/', verifyToken, (req, res) => {
    const orderData = {
        TableName: process.env.TABLE_NAME_ORDERS,
        Item: {
            OrderID: Date.now().toString(),
            Username: req.user['cognito:username'],
            ProductID: req.body.ProductID,
            Quantity: req.body.Quantity,
            OrderDate: new Date().toISOString()
        }
    };
    dynamodb.put(orderData, (err, data) => {
        if (err) {
            console.error('无法添加订单:', JSON.stringify(err, null, 2));
            res.status(500).send('下订单时出错');
        } else {
            res.status(200).send('订单下达成功');
        }
    });
});

module.exports = router;