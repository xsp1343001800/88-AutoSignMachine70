const {
    RSAUtils
} = require('./RSAUtils');
const {
    appInfo,
    buildUnicomUserAgent
} = require('../../../utils/device')
const {
    default: PQueue
} = require('p-queue');
const transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data["" + item + ""]);
    }
    return params;
};

var dailyBookRead1GFlowTask = {
    login: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        //密码加密
        var modulus = "00A828DB9D028A4B9FC017821C119DFFB8537ECEF7F91D4BC06DB06CC8B4E6B2D0A949B66A86782D23AA5AA847312D91BE07DC1430C1A6F6DE01A3D98474FE4511AAB7E4E709045B61F17D0DC4E34FB4BE0FF32A04E442EEE6B326D97E11AE8F23BF09926BF05AAF65DE34BB90DEBDCEE475D0832B79586B4B02DEED2FC3EA10B3";
        var exponent = "010001";
        var key = RSAUtils.getKeyPair(exponent, '', modulus);
        let phonenum = RSAUtils.encryptedString(key, options.user);

        let {
            data,
            config
        } = await axios.request({
            headers: {
                "user-agent": useragent
            },
            url: `http://10010.woread.com.cn/touchextenernal/common/shouTingLogin.action`,
            method: 'POST',
            data: transParams({
                phonenum
            })
        })

        if (data.code === '0000' && data.innercode === '0000') {
            console.info(data.message)
            return config.jar
        } else {
            console.error('登录失败，请稍后再试')
            return null;
        }
    },
    getBookList: async (axios, options) => {
        let {
            jar
        } = options;
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            "bindType": "",
            "categoryindex": 115675,
            "curpage": 1,
            "limit": 10,
            "pageIndex": "11244",
            "cardid": "10238"
        }
        while(true) {
            let {
                data
            } = await axios.request({
                headers: {
                    "user-agent": useragent,
                    "referer": `https://10010.woread.com.cn/touchextenernal/read/bookList.action`,
                    "origin": "https://10010.woread.com.cn",
                },
                url: `http://10010.woread.com.cn/touchextenernal/read/getBookList.action`,
                method: 'post',
                data: transParams(params),
                jar
            })
            if (data.code === '0000') {
                console.info('书籍列表获取成功!')
                return data.message;
            } else {
                console.info('书籍列表获取失败,10秒后重试!')
                await new Promise((resolve, reject) => setTimeout(resolve, 10 * 1000))
            }
        }
    },
    doCheckRightOfGoldCoin: async (axios, options) => {
        let {
            jar
        } = options;
        const useragent = buildUnicomUserAgent(options, 'p')
        let {
            data
        } = await axios.request({
            headers: {
                "user-agent": useragent,
                "origin": "https://10010.woread.com.cn"
            },
            url: `http://10010.woread.com.cn/touchextenernal/readActivity/checkRightOfGoldCoin.action`,
            method: 'get',
            jar
        })

        if (data.code === '0000') {
            if (data.message.daySurplus === undefined) {
                console.warn(data.message);
                return 0;
            } else {
                return data.message.daySurplus
            }
        } else {
            console.error("获取剩余阅读次数失败!使用默认值: 10");
            return 10;
        }
    },
    doSendRightOfGoldCoin: async (axios, options) => {
        let {
            jar
        } = options;
        const useragent = buildUnicomUserAgent(options, 'p')
        let {
            data
        } = await axios.request({
            headers: {
                "user-agent": useragent,
                "origin": "https://10010.woread.com.cn"
            },
            url: `http://10010.woread.com.cn/touchextenernal/readActivity/sendRightOfGoldCoin.action?userType=112_3001&homeArea=051&homeCity=540`,
            method: 'get',
            jar
        })
        console.reward('flow', '100m')
    },
    doUpdateReadTime: async (axios, options) => {
        let {
            jar,
            cntindex,
            cntname
        } = options;
        console.info(cntname)

        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            "cntindex": cntindex,
            "cntname": cntname,
            "time": 2
        }
        let n = 1;
        while (n <= 3) {
            console.info('第', n, '次')
            let {
                data
            } = await axios.request({
                headers: {
                    "user-agent": useragent,
                    "origin": "https://10010.woread.com.cn"
                },
                url: `http://10010.woread.com.cn//touchextenernal/contentread/ajaxUpdatePersonReadtime.action`,
                method: 'post',
                jar,
                data: transParams(params)

            })
            console.info("等待2分钟")
            await new Promise((resolve, reject) => setTimeout(resolve, 2 * (Math.floor(Math.random() * 10) + 60) * 1000))
            n++
        }

        await dailyBookRead1GFlowTask.doSendRightOfGoldCoin(axios, {
            ...options,
            jar
        });
    },
    doTask: async (axios, options) => {
        let jar = await dailyBookRead1GFlowTask.login(axios, options)
        if (jar !== null) {
            let books = await dailyBookRead1GFlowTask.getBookList(axios, {
                ...options,
                jar
            })
            let daySurplus = await dailyBookRead1GFlowTask.doCheckRightOfGoldCoin(axios, {
                ...options,
                jar
            })

            console.info("剩余阅读次数", daySurplus)
            let i = books.length - daySurplus;
            while (daySurplus > 0 && i < books.length) {
                let book = books[i];
                await dailyBookRead1GFlowTask.doUpdateReadTime(axios, {
                    ...options,
                    jar,
                    cntindex: book.cntindex,
                    cntname: book.cntname
                })

                daySurplus = await dailyBookRead1GFlowTask.doCheckRightOfGoldCoin(axios, {
                    ...options,
                    jar
                })
                i++;
            }
        }
    }
}

module.exports = dailyBookRead1GFlowTask