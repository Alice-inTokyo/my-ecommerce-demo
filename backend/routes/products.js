const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
require('dotenv').config();

// AWS 配置
AWS.config.update({ region: process.env.REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient();

// 获取所有产品
router.get('/', (req, res) => {
    const params = {
        TableName: process.env.TABLE_NAME_PRODUCTS
    };
    dynamodb.scan(params, (err, data) => {
        if (err) {
            console.error('无法扫描表格:', JSON.stringify(err, null, 2));
            res.status(500).send('获取产品时出错');
        } else {
            res.json(data.Items);
        }
    });
});

module.exports = router;