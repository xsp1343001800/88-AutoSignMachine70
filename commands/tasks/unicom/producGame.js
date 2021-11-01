const CryptoJS = require("crypto-js");
var crypto = require('crypto');
const {
    default: PQueue
} = require('p-queue');
const moment = require('moment');
const path = require('path');
const {
    appInfo,
    buildUnicomUserAgent
} = require('../../../utils/device')
const {
    signRewardVideoParams
} = require('./CryptoUtil');
const {
    info
} = require("console");
var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};


var deviceInfos = [
    'm=VKY-AL00&o=9&a=28&p=1080*1920&f=HUAWEI&mm=5725&cf=1800&cc=8&qqversion=null',
    'm=SM-G977N&o=7&a=24&p=1080*1920&f=samsung&mm=5725&cf=1800&cc=8&qqversion=null',
    'm=Pixel&o=8&a=27&p=1080*1920&f=google&mm=5725&cf=1800&cc=8&qqversion=null'
]
var deviceInfo = deviceInfos[Math.floor(Math.random() * deviceInfos.length)]

var producGame = {
    gameSignin: (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let data = {
            'methodType': 'signin'
        }
        return new Promise((resolve, reject) => {
            axios.request({
                baseURL: 'https://m.client.10010.com/',
                headers: {
                    "user-agent": useragent,
                    "referer": "https://img.client.10010.com",
                    "origin": "https://img.client.10010.com"
                },
                url: `/producGame_signin`,
                method: 'post',
                data: transParams(data)
            }).then(res => {
                let result = res.data
                if (result) {
                    if (result.respCode !== '0000') {
                        console.error('娱乐中心每日签到失败', result.respDesc)
                    } else {
                        if (result.currentIntegral) {
                            console.reward('integral', result.currentIntegral)
                            console.info('娱乐中心每日签到获得+' + result.currentIntegral)
                        } else {
                            console.info('娱乐中心每日签到', result.respDesc)
                        }
                    }
                } else {
                    console.error('娱乐中心每日签到失败')
                }
                resolve()
            }).catch(reject)
        })
    },

    playGame: async (axios, options) => {
        const {
            game,
            launchid,
            jar
        } = options

        let cookiesJson = jar.toJSON()
        let jwt = cookiesJson.cookies.find(i => i.key == 'jwt')
        if (!jwt) {
            throw new Error('jwt缺失')
        }
        jwt = jwt.value

        let playGame = require(path.resolve(path.join(__dirname, './playGame.json')));
        let protobufRoot = require('protobufjs').Root;
        let root = protobufRoot.fromJSON(playGame);
        let mc = root.lookupType('JudgeTimingBusiBuff');
        let launchId1 = launchid || new Date().getTime() + ''

        let n = 1;
        //玩游戏时长参数 game.minute
        let minute = game.minute || 6;

        do {
            console.info('第', n, '次')
            let dd = moment().format('MMDDHHmmss')
            let time = new Date().getTime() % 1000
            let s = Math.floor(Math.random() * 90000) + 10000
            let traceid = `${options.user}_${dd}${time}_${s}`
            let Seq = n * 3

            let a = {
                'uin': `${options.user}`,
                'sig': jwt,
                'platform': '2001',
                'type': 0,
                'appid': '101794394'
            }
            let busiBuff = {
                extInfo: null,
                appid: game.gameCode,
                factType: n == minute ? 13 : 12,
                duration: null,
                reportTime: Math.floor(new Date().getTime() / 1000) + n * 62,
                afterCertify: 0,
                appType: 1,
                scene: 1001,
                totalTime: n * 62,
                launchId: launchId1,
                via: '',
                AdsTotalTime: 0,
                hostExtInfo: null
            }
            let c = {
                'Seq': Seq,
                'qua': 'V1_AND_MINISDK_1.5.3_0_RELEASE_B',
                'deviceInfo': deviceInfo,
                'busiBuff': busiBuff,
                'traceid': traceid,
                'Module': `mini_app_growguard`,
                'Cmdname': 'JudgeTiming',
                'loginSig': a,
                'Crypto': null,
                'Extinfo': null,
                'contentType': 0
            }

            let infoEncodeMessage = mc.encode(mc.create(c)).finish();

            let Nonce = Math.floor(Math.random() * 90000) + 10000
            let Timestamp = Math.floor(new Date().getTime() / 1000)

            let str = `POST /mini/OpenChannel?Action=input&Nonce=${Nonce}&PlatformID=2001&SignatureMethod=HmacSHA256&Timestamp=${Timestamp}`
            let Signature = CryptoJS.HmacSHA256(str, 'test')
            let hashInBase64 = CryptoJS.enc.Base64.stringify(Signature);

            let res = await axios.request({
                headers: {
                    "user-agent": "okhttp/4.4.0"
                },
                jar: null,
                url: `https://q.qq.com/mini/OpenChannel?Action=input&Nonce=${Nonce}&PlatformID=2001&SignatureMethod=HmacSHA256&Timestamp=${Timestamp}&Signature=${hashInBase64}`,
                method: 'post',
                responseType: 'arrayBuffer',
                data: infoEncodeMessage
            }).catch(err => console.error(err))

            console.info(Buffer.from(res.data).toString('hex'))

            await new Promise((resolve, reject) => setTimeout(resolve, 45 * 1000))

                ++n
        } while (n <= minute)
    },
    gameInfo: async (axios, options) => {
        const {
            game,
            jar
        } = options

        let cookiesJson = jar.toJSON()
        let jwt = cookiesJson.cookies.find(i => i.key == 'jwt')
        if (!jwt) {
            throw new Error('jwt缺失')
        }
        jwt = jwt.value

        let playGame = require(path.resolve(path.join(__dirname, './playGame.json')));
        let protobufRoot = require('protobufjs').Root;
        let root = protobufRoot.fromJSON(playGame);
        let mc = root.lookupType('GetAppInfoByLinkBusiBuff');

        let n = 1;

        let dd = moment().format('MMDDHHmmss')
        let time = new Date().getTime() % 1000
        let s = Math.floor(Math.random() * 90000) + 10000
        let traceid = `${options.user}_${dd}${time}_${s}`
        let Seq = n * 3

        let a = {
            'uin': `${options.user}`,
            'sig': jwt,
            'platform': '2001',
            'type': 0,
            'appid': '101794394'
        }
        let busiBuff = {
            link: game.url,
            linkType: 0
        }
        let c = {
            'Seq': Seq,
            'qua': 'V1_AND_MINISDK_1.5.3_0_RELEASE_B',
            'deviceInfo': deviceInfo,
            'busiBuff': Buffer.from(JSON.stringify(busiBuff)),
            'traceid': traceid,
            'Module': `mini_app_info`,
            'Cmdname': 'GetAppInfoByLink',
            'loginSig': a,
            'Crypto': null,
            'Extinfo': null,
            'contentType': 1
        }

        let infoEncodeMessage = mc.encode(mc.create(c)).finish();

        let Nonce = Math.floor(Math.random() * 90000) + 10000
        let Timestamp = Math.floor(new Date().getTime() / 1000)

        let str = `POST /mini/OpenChannel?Action=input&Nonce=${Nonce}&PlatformID=2001&SignatureMethod=HmacSHA256&Timestamp=${Timestamp}`
        let Signature = CryptoJS.HmacSHA256(str, 'test')
        let hashInBase64 = CryptoJS.enc.Base64.stringify(Signature);

        let res = await axios.request({
            headers: {
                "user-agent": "okhttp/4.4.0"
            },
            jar: null,
            url: `https://q.qq.com/mini/OpenChannel?Action=input&Nonce=${Nonce}&PlatformID=2001&SignatureMethod=HmacSHA256&Timestamp=${Timestamp}&Signature=${hashInBase64}`,
            method: 'post',
            responseType: 'arrayBuffer',
            data: infoEncodeMessage
        }).catch(err => console.error(err))
        let result = JSON.parse(Buffer.from(res.data).slice(0x7).toString('utf-8'))
        return result
    },
    popularGames: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'methodType': 'popularGames',
            'deviceType': 'Android',
            'clientVersion': appInfo.version,
        }
        let defaults = {
            baseURL: 'https://m.client.10010.com/',
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `/producGameApp`,
            method: 'post',
            data: transParams(params)
        }
        // 安卓
        let {
            data: androidData,
            config
        } = await axios.request(defaults)
        // ios
        let {
            data: iosData
        } = await axios.request(Object.assign({}, defaults, {
            data: transParams(Object.assign({}, params, {
                'deviceType': 'iOS'
            }))
        }));
        if (androidData) {
            let jar = config.jar,
                popularList = androidData.popularList || [],
                gameDeviceTypes = new Map();
            androidData.popularList.forEach(e => gameDeviceTypes.set(e.id, "Android"));
            if (iosData) {
                let games = new Map();
                // 合并去重
                [...androidData.popularList, ...iosData.popularList].forEach(game => games.set(game.id, game));
                popularList = [...games.values()];
                // 取出ios游戏
                let iosGames = iosData.popularList.filter(a => !androidData.popularList.some(i => i.id === a.id));
                iosGames.forEach(e => gameDeviceTypes.set(e.id, "iOS"));
            }
            return {
                jar: jar,
                gameDeviceTypes: gameDeviceTypes,
                popularList: popularList
            }
        } else {
            console.error('记录失败')
        }
    },
    gameverify: async (axios, options) => {
        const {
            jar
        } = options
        let cookiesJson = jar.toJSON()
        let jwt = cookiesJson.cookies.find(i => i.key == 'jwt')
        if (!jwt) {
            throw new Error('jwt缺失')
        }
        jwt = jwt.value

        let {
            data
        } = await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
                "user-agent": "okhttp/4.4.0",
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `/game/verify`,
            method: 'post',
            data: {
                "extInfo": jwt,
                "auth": {
                    "uin": options.user,
                    "sig": jwt
                }
            }
        })
        if (data) {
            if (data.respCode !== 0) {
                console.info(data.errorMessage)
            }
        } else {
            console.error('记录失败')
        }
    },
    gamerecord: async (axios, options) => {
        const {
            gameId,
            deviceType
        } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'methodType': 'record',
            'deviceType': deviceType,
            'clientVersion': appInfo.version,
            'gameId': gameId,
            'taskId': ''
        }
        let {
            data
        } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/producGameApp`,
            method: 'post',
            data: transParams(params)
        })
        if (data) {
            console.info(data.msg)
        } else {
            console.error('记录失败')
        }
    },
    queryIntegral: async (axios, options) => {
        let {
            deviceType
        } = options;
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'methodType': 'queryIntegral',
            'taskCenterId': options.taskCenterId,
            'videoIntegral': '0',
            'isVideo': 'Y',
            'clientVersion': appInfo.version,
            'deviceType': deviceType
        }
        let {
            data,
            config
        } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/producGameTaskCenter`,
            method: 'post',
            data: transParams(params)
        })
        if (data.code === '0000') {
            console.info('获取积分任务状态成功')
        } else {
            console.error('获取积分任务状态失败')
        }
    },
    getTaskList: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'methodType': 'queryTaskCenter',
            'deviceType': 'Android',
            'clientVersion': appInfo.version
        }

        let defaults = {
            baseURL: 'https://m.client.10010.com',
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `/producGameTaskCenter`,
            method: 'post',
            data: transParams(params)
        }
        // 安卓
        let {
            data: androidGames,
            config
        } = await axios.request(defaults)
        // ios
        let {
            data: iosGames
        } = await axios.request(Object.assign({}, defaults, {
            data: transParams(Object.assign({}, params, {
                'deviceType': 'iOS'
            }))
        }));
        if (androidGames) {
            let jar = config.jar,
                games = androidGames.data || [],
                gameDeviceTypes = new Map();
            androidGames.data.forEach(e => gameDeviceTypes.set(e.game_id, "Android"));
            if (iosGames) {
                let map = new Map();
                // 合并去重
                [...androidGames.data, ...iosGames.data].forEach(game => map.set(game.id, game));
                games = [...map.values()];
                // 取出ios游戏
                let iosData = iosGames.data.filter(a => !androidGames.data.some(i => i.id === a.id));
                iosData.forEach(e => gameDeviceTypes.set(e.game_id, "iOS"));
            }
            return {
                jar: jar,
                gameDeviceTypes: gameDeviceTypes,
                games: games
            }
        } else {
            console.error('获取游戏任务失败')
            return {}
        }
    },
    doGameFlowTask: async (axios, options) => {
        let {
            popularList: allgames,
            jar
        } = await producGame.popularGames(axios, options)
        let games = allgames.filter(g => g.state === '0')
        console.info('剩余未完成game', games.length)

        // 手q
        let qqGames = games.filter(g => g.qqMark === 'Y');
        if (qqGames.length > 0) {
            let queue = new PQueue({
                concurrency: 2
            });
            console.info('手q未完成数', qqGames.length)
            console.info('手q调度任务中', '并发数', 2)
            for (let game of qqGames) {
                queue.add(async () => {
                    console.info(`${game.name}--游戏时长: ${game.minute} 分钟`)
                    await producGame.gameverify(axios, {
                        ...options,
                        jar,
                        game
                    })
                    await producGame.playGame(axios, {
                        ...options,
                        jar,
                        game
                    })
                })
            }

            await queue.onIdle();
        }

        // 沃游戏
        let woGames = games.filter(g => g.qqMark === 'N');
        if (woGames.length > 0) {
            console.info('沃游戏未完成数', woGames.length)
            /* if (process.env['GITHUB_ACTIONS']) {
                console.warn("GitHub Actions 无法访问沃游戏，跳过本次任务，继续下一任务。")
            } else {
                
            } */
            let queue = new PQueue({
                concurrency: 1
            });
            console.info('沃游戏调度任务中', '并发数', 1)
            for (let game of woGames) {
                queue.add(async () => {
                    console.info(`${game.name}--游戏时长: ${game.minute} 分钟`)
                    await require('./xiaowogameh5').playGame(axios, {
                        ...options,
                        game
                    })

                    console.info(`【${game.name}】游戏结束`)
                    console.info("继续等待一分钟，完成游戏时长上报")
                    await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 60) * 1000))
                })
            }
            await queue.onIdle();
        }

        await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 15) * 1000))

        let {
            popularList: gameTasks,
            gameDeviceTypes
        } = await producGame.timeTaskQuery(axios, options)
        games = gameTasks.filter(g => g.state === '1')
        console.info('剩余未领取game', games.length)
        for (let game of games) {
            await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 15) * 1000))
            await producGame.gameFlowGet(axios, {
                ...options,
                gameId: game.id,
                deviceType: gameDeviceTypes.get(game.id)
            })
        }
    },
    doGameIntegralTask: async (axios, options) => {
        let {
            games,
            jar,
            gameDeviceTypes
        } = await producGame.getTaskList(axios, options)
        games = games.filter(d => d.reachState === '0' && d.task_type === 'duration')
        console.info('剩余未完成game', games.length)
        let queue = new PQueue({
            concurrency: 2
        });

        console.info('调度任务中', '并发数', 2)
        for (let game of games) {
            queue.add(async () => {
                console.info(`${game.name}-游戏时长: ${game.task} 分钟`)
                await producGame.gameverify(axios, {
                    ...options,
                    jar,
                    game
                })
                await producGame.gamerecord(axios, {
                    ...options,
                    gameId: game.game_id,
                    deviceType: gameDeviceTypes.get(game.game_id)
                })
                await producGame.playGame(axios, {
                    ...options,
                    jar,
                    game: {
                        ...game,
                        gameCode: game.resource_id,
                        minute: game.task
                    }
                })
            })
        }

        await queue.onIdle()

        await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 30) * 1000))
        let {
            games: cgames,
            gameDeviceTypes: deviceTypes
        } = await producGame.getTaskList(axios, options)
        games = cgames.filter(d => d.reachState === '1' && d.task_type === 'duration')
        console.info('剩余未领取game', games.length)
        for (let game of games) {
            await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 20) * 1000))
            await producGame.gameIntegralGet(axios, {
                ...options,
                taskCenterId: game.id,
                reward: game.task_reward,
                deviceType: deviceTypes.get(game.game_id)
            })
        }

        let {
            games: v_games
        } = await producGame.getTaskList(axios, options)
        let video_task = v_games.find(d => d.task_type === 'video')

        if (video_task.reachState === '0') {
            let n = parseInt(video_task.task) - parseInt(video_task.progress)
            console.info('领取视频任务奖励,剩余', n, '次')
            let {
                jar
            } = await producGame.watch3TimesVideoQuery(axios, options)
            let i = 1
            while (i <= n) {
                await producGame.watch3TimesVideo(axios, {
                    ...options,
                    jar
                })
                await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 5) + 2) * 200))
                await producGame.getTaskList(axios, options)
                await producGame.queryIntegral(axios, {
                        ...options,
                        taskCenterId: video_task.id
                    })
                    ++i
            }
        }

        await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 5) + 5) * 1000))
        let {
            games: ngames
        } = await producGame.getTaskList(axios, options)
        let task_times = ngames.find(d => d.task === '3' && d.task_type === 'times')
        if (task_times && task_times.reachState === '1') {
            await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 15) * 1000))
            await producGame.gameIntegralGet(axios, {
                ...options,
                taskCenterId: task_times.id
            })
        }
    },
    timeTaskQuery: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'methodType': 'timeTaskQuery',
            'deviceType': 'Android',
            'clientVersion': appInfo.version
        }
        let {
            data
        } = await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `/producGameApp`,
            method: 'post',
            data: transParams(params)
        })
        if (data) {
            console.info(data.msg)
            return await producGame.popularGames(axios, options);
        } else {
            console.error('记录失败')
        }
    },
    gameFlowGet: async (axios, options) => {
        const {
            gameId,
            deviceType
        } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'userNumber': options.user,
            'methodType': 'flowGet',
            'gameId': gameId,
            'deviceType': deviceType,
            'clientVersion': appInfo.version
        }
        let {
            data
        } = await axios.request({
            baseURL: 'https://m.client.10010.com/',
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com",
                "X-Requested-With": appInfo.package_name
            },
            url: `/producGameApp`,
            method: 'post',
            data: transParams(params)
        })
        if (data) {
            console.info(data.msg)
            if (data.msg.indexOf('防刷策略接口校验不通过') !== -1) {
                console.error('获取奖励失败')
            }
            try {
                console.reward('flow', data.data.flow + 'm')
            } catch (error) {
                console.error('获取奖励失败')
            }
        } else {
            console.error('获取奖励失败')
        }
    },
    gameIntegralGet: async (axios, options) => {
        const {
            taskCenterId,
            reward,
            deviceType
        } = options
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'methodType': 'taskGetReward',
            'taskCenterId': taskCenterId,
            'deviceType': deviceType || 'Android',
            'clientVersion': appInfo.version,
        }
        let {
            data
        } = await axios.request({
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `https://m.client.10010.com/producGameTaskCenter`,
            method: 'post',
            data: transParams(params)
        })
        if (data) {
            console.info(data.msg)
            if (data.msg.indexOf('防刷策略接口校验不通过') !== -1) {
                //    throw new Error('出现【防刷策略接口校验不通过】, 取消本次执行')
                console.error('获取奖励失败')
            }
            if (reward) {
                console.reward('integral', reward)
            }
        } else {
            console.error('获取奖励失败')
        }
    },
    gameBox: async (axios, options) => {
        let {
            games: v_games
        } = await producGame.getTaskList(axios, options)
        let box_task = v_games.find(d => d.task_type === 'box' && d.reachState !== '2')
        if (box_task) {
            await producGame.gameIntegralGet(axios, {
                ...options,
                taskCenterId: box_task.id
            })
        }
    },
    watch3TimesVideoQuery: async (request, options) => {
        let params = {
            'arguments1': 'AC20200728150217',
            'arguments2': 'GGPD',
            'arguments3': '96945964804e42299634340cd2650451',
            'arguments4': new Date().getTime(),
            'arguments6': '',
            'netWay': 'Wifi',
            'version': appInfo.unicom_version,
            'codeId': 945535736
        }
        params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
        return await require('./taskcallback').query(request, {
            ...options,
            params
        })
    },
    watch3TimesVideo: async (axios, options) => {
        const {
            jar
        } = options
        let params = {
            'arguments1': 'AC20200728150217',
            'arguments2': 'GGPD',
            'arguments3': '96945964804e42299634340cd2650451',
            'arguments4': new Date().getTime(),
            'arguments6': '',
            'arguments7': '',
            'arguments8': '',
            'arguments9': '',
            'netWay': 'Wifi',
            'remark1': '游戏频道看视频得积分',
            'remark': '游戏视频任务积分',
            'version': appInfo.unicom_version,
            'codeId': 945535736
        }
        params['sign'] = signRewardVideoParams([params.arguments1, params.arguments2, params.arguments3, params.arguments4])
        await require('./taskcallback').reward(axios, {
            ...options,
            params,
            jar
        })
    },
    doTodayDailyTask: async (axios, options) => {
        let {
            games
        } = await producGame.getTaskList(axios, options)
        let today_task = games.find(d => d.task_type === 'todayTask')
        if (!today_task) {
            console.info('未取得今日任务，跳过')
            return
        }
        if (today_task.reachState === '0') {
            throw new Error('部分日常任务未完成，下次再尝试领取完成今日任务流量')
        } else if (today_task.reachState === '1') {
            await producGame.gameIntegralGet(axios, {
                ...options,
                taskCenterId: today_task.id,
            })
            console.reward('flow', today_task.task_reward)
            console.info(`领取完成今日任务流量+${today_task.task_reward}`)
        } else if (today_task.reachState === '2') {
            console.info('每日日常任务已完成')
        }
    },
    /**
     * 游戏红包总金额
     * 
     * @param {*} axios 
     * @param {*} options 
     * @returns 
     */
    queryActRewardInfo: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let {
            data
        } = await axios.request({
            baseURL: 'https://m.client.10010.com',
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `/game_server/newGameActivity/actRewardInfo`,
            method: 'post',
            data: transParams({
                'deviceType': 'Android',
                'clientVersion': appInfo.version
            })
        })
        return {
            ...data.data
        }
    },
    /**
     * 领取抽奖次数
     * @param {*} axios 
     * @param {*} options 
     */
    getDrawTimes: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'methodType': 1,
            'mobile': options.user,
            'param': {
                'deviceType': 'Android',
                'gameType': 'Y'
            }
        }
        let {
            data
        } = await axios.request({
            baseURL: 'https://m.client.10010.com',
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `/finderInterface/myCircleForEntertainment`,
            method: 'post',
            data: transParams(params)
        })
        console.info(data.desc)
    },
    /**
     * 领取抽奖次数
     * @param {*} axios 
     * @param {*} options 
     */
    getDrawTimes: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let {
            game
        } = options
        let params = {
            'deviceType': 'Android',
            'clientVersion': appInfo.version,
            'gameId': game.gameId,
            'gamePosition': game.templateSystem ? 1 : 2,
            'deviceCode': '',
        }
        let {
            data
        } = await axios.request({
            baseURL: 'https://m.client.10010.com',
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `/game_server/newGameActivity/getDrawTimes`,
            method: 'post',
            data: transParams(params)
        })
        console.info(data.desc)
    },
    /**
     * 抽奖游戏列表
     * 
     * @param {*} axios 
     * @param {*} options 
     * @returns 
     */
    getLotteryGameList: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let {
            data,
            config
        } = await axios.request({
            baseURL: 'https://m.client.10010.com',
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `/game_server/newGameActivity/gameList`,
            method: 'post',
            data: transParams({
                'deviceType': 'Android',
                'clientVersion': appInfo.version
            })
        })
        if (data.code === '0000') {
            return {
                jar: config.jar,
                games: [...data.data.newGames, ...data.data.templateGames]
            }
        } else {
            throw new Error("游戏列表获取失败")
        }
    },
    /**
     * 游戏抽奖
     * 
     * @param {*} axios 
     * @param {*} options 
     */
    doLottery: async (axios, options) => {
        const useragent = buildUnicomUserAgent(options, 'p')
        let params = {
            'deviceType': 'Android',
            'clientVersion': appInfo.version,
            'deviceCode': '',
            'isTen': 'N'
        }
        let {
            data
        } = await axios.request({
            baseURL: 'https://m.client.10010.com',
            headers: {
                "user-agent": useragent,
                "referer": "https://img.client.10010.com",
                "origin": "https://img.client.10010.com"
            },
            url: `/game_server/newGameActivity/lottery`,
            method: 'post',
            data: transParams(params)
        })
        if (data.code === '0000') {
            let res = JSON.parse(data.data)[0];
            console.reward('红包', res.ticketVal)
            console.info(data.desc, res.ticketName)
        } else {
            console.error('抽奖失败', data.desc)
        }
    },
    /**
     * 全礼以赴，嗨玩一夏 抽88元
     * 
     * @param {*} axios 
     * @param {*} options 
     */
    doGameLottery: async (axios, options) => {
        // 1次免费抽奖
        await producGame.doLottery(axios, options)

        let {
            jar,
            games: allGames
        } = await producGame.getLotteryGameList(axios, options)
        let games = allGames.filter(g => g.actState === '0')
        console.info('剩余未完成game', games.length)

        let queue = new PQueue({
            concurrency: 2
        });
        for (let game of games) {
            game['minute'] = game.gameMinute;
            game['gameCode'] = game.resourceId;

            queue.add(async () => {
                console.info(`${game.name}--游戏时长: ${game.minute} 分钟`)

                await producGame.gameverify(axios, {
                    ...options,
                    jar,
                    game
                })
                await producGame.gamerecord(axios, {
                    ...options,
                    gameId: game.gameId,
                    deviceType: 'Android' //gameDeviceTypes.get(game.game_id)
                })
                await producGame.playGame(axios, {
                    ...options,
                    jar,
                    game
                })
            })
        }

        await queue.onIdle();

        await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 30) * 1000))

        let {
            games: newGames
        } = await producGame.getLotteryGameList(axios, options)
        games = newGames.filter(g => g.actState === '1')

        // 领取抽奖次数并抽奖
        for (let game of games) {
            await producGame.getDrawTimes(axios, {
                ...options,
                game
            })
            await producGame.doLottery(axios, options)

            await new Promise((resolve, reject) => setTimeout(resolve, (Math.floor(Math.random() * 10) + 5) * 1000))
        }

        let {
            costSum
        } = await producGame.queryActRewardInfo(axios, options)
        console.info('红包总金额', costSum)
    },
}


module.exports = producGame