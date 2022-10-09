import express, { json } from 'express';
import fs from "fs";
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary'
import ConnectDatabase from './config/database';
import { config } from './config';
import { PermitSchema, RandomNumberSchema, RerollSchema, StakeSchema, UserSchema } from './model';
import axios from "axios";
import { random } from './utils';

const app = express();
const fileUpload = require('express-fileupload')
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload());
app.use(cors());

cloudinary.config({
    cloud_name: 'dmywuzdlq',
    api_key: '863316378827326',
    api_secret: 'NuVPNL-D0PKz9sBOcwDqsVnX6AY',
    secure: true
})

ConnectDatabase(config.mongoURI);

const PORT = process.env.PORT || 3005;
const DAY_TIME = 60;
const { exec } = require("child_process");

app.get('/', async (req, res) => {
    let permitList = await PermitSchema.find();
    let randomNumberList = await RandomNumberSchema.find();
    res.json({ 
        result: 'result', 
        permitList: permitList, 
        randomNumberList: randomNumberList 
    });
});

app.post('/permitList', async (req, res) => {
    let list = await PermitSchema.find();
    res.json({
        result: list
    })
})

app.post('/checkPermit', async (req, res) => {
    let result = false;
    let token = req.body.token;
    let type = req.body.type;
    PermitSchema.countDocuments({ address: token, type: type }, function (err, count) {
        console.log(`count::`, count);
        if (count == 0) {
            res.json({
                result: false
            })
        } else {
            res.json({
                result: true
            })
        }
    })
})

app.post('/update_new', async (req, res) => {
    console.log(`----- update new is started -----`);
    console.log(`params:::`, req.body);
    let address = req.body.mint;
    let uri = req.body.uri;

    let cmd;
    cmd = `metaboss update uri --keypair ./birdzcli.json --account ${address} --new-uri ${uri}`;
    console.log(`update new cmd--`, cmd);

    const { exec } = require("child_process");

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            res.json({
                result: 'error',
            })
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            res.json({
                result: 'error',
            })
            return;
        }
        res.json({
            result: 'success',
        })
    });
});

app.post('/update', async (req, res) => {
    console.log(`----- update is started -----`);
    console.log(`params:::`, req.body);
    let address = req.body.mint;
    let uri = req.body.uri;
    let name = req.body.name;
    let type = req.body.type;
    let cmd = `metaboss update uri --keypair ./update_key.json --account ${address} --new-uri ${uri}`;
    let cmd1;
    try {
        let metaJson = await axios.post(uri);
        let name = metaJson.data.name;
        console.log(`name::`, name);
        cmd1 = `metaboss update name --keypair ./update_key.json --account ${address} --new-name "${name}"`
        PermitSchema.countDocuments({ address: address, type: type }, async function (err, count) {
            try {
                if (count == 0) {
                    let newData = new PermitSchema({
                        address: address,
                        type: type
                    });
                    await newData.save();
                }
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                        res.json({
                            result: 'update uri error',
                        })
                        return;
                    }
                    if (stderr) {
                        console.log(`stderr: ${stderr}`);
                        res.json({
                            result: 'update uri error',
                        })
                        return;
                    }
                    console.log(`stdout: ${stdout}`);

                    exec(cmd1, (error, stdout, stderr) => {
                        if (error) {
                            console.log(`error: ${error.message}`);
                            res.json({
                                result: 'update name error',
                            })
                            return;
                        }
                        if (stderr) {
                            console.log(`stderr: ${stderr}`);
                            res.json({
                                result: 'update name error',
                            })
                            return;
                        }
                        console.log(`stdout: ${stdout}`);
                        res.json({
                            result: 'success'
                        })
                    })
                });
            } catch (err) {
                res.json({
                    result: 'mongo db count error'
                })
            }
        })
    } catch (err) {
        res.json({
            result: 'mongo db error'
        })
    }

    // PermitSchema.countDocuments({ address: address }, async function (err, count) {
    //     try {
    //         if (count == 0) {
    //             let newData = new PermitSchema({
    //                 address: address
    //             });
    //             await newData.save();
    //         }
    //         // exec(cmd, (error, stdout, stderr) => {
    //         //     if (error) {
    //         //         console.log(`error: ${error.message}`);
    //         //         res.json({
    //         //             result: 'error',
    //         //         })
    //         //         return;
    //         //     }
    //         //     if (stderr) {
    //         //         console.log(`stderr: ${stderr}`);
    //         //         res.json({
    //         //             result: 'error',
    //         //         })
    //         //         return;
    //         //     }
    //         //     console.log(`stdout: ${stdout}`);

    //         //     res.json({
    //         //         result: 'success'
    //         //     })
    //         // });
    //     } catch (err) {
    //         res.json({
    //             result: 'error'
    //         })
    //     }
    // })

    // let name1;
    // if (type == 'true') {
    //     let b = "2D_";
    //     name1 = [b, name].join('');
    // } else {
    //     name1 = name.replace("2D_", "");
    // }
    // cmd = `metaboss update name --keypair ./birdzcli.json --account ${address} --new-name "${name1}"`;

})

/**
 * Re-roll apis...
 */

app.post('/get_number', async (req, res) => {

    let prevNumber = req.body.number;
    let address = req.body.address;
    let wallet = req.body.wallet;

    console.log(`prev::`, prevNumber);
    console.log(`address::`, address);
    console.log(`wallet::`, wallet);

     await random(0, prevNumber, res, address, wallet);

})

app.post('/clean_random', async (req, res) => {
    try {
        await RandomNumberSchema.deleteMany({});
        res.json({
            result: 'success'
        })
    } catch (err) {
        res.json({
            result: 'error'
        })
    }
})

app.post('/get_reroll_member', async (req, res) => {
    let member = await RerollSchema.find();
    res.json({
        member: member
    });
})

/**
 * Stake apis...
 */
app.post('/stake', async (req, res) => {
    let ownerWallet = req.body.ownerWallet;
    let nft = req.body.nft;
    console.log(`ownerWallet::`, ownerWallet)
    console.log(`nft::`, nft)
    try {
        StakeSchema.countDocuments({ ownerWallet: ownerWallet }, async function (err, count) {
            try {
                if (count == 0) {
                    const newData = new StakeSchema({
                        ownerWallet: ownerWallet,
                        mint: [{
                            mint: nft,
                            stakeTime: Date.now()
                        }],
                    });

                    const saveData = await newData.save();

                    if (!saveData) {
                        throw new Error("Database Error");
                    }
                } else {
                    let existData = await StakeSchema.findOne({ ownerWallet: ownerWallet });
                    existData.mint.push({
                        mint: nft,
                        stakeTime: Date.now()
                    });
                    await existData.save();
                }
                res.json({
                    result: true,
                })
            } catch (err) {
                res.json({
                    result: false,
                })
            }
        })
    } catch (err) {
        res.json({
            result: false
        })
    }

})

app.post('/unstake', async (req, res) => {
    let ownerWallet = req.body.ownerWallet;
    let nft = req.body.nft;
    console.log(`ownerWallet::`, ownerWallet)
    console.log(`nft::`, nft)
    try {

        StakeSchema.countDocuments({ ownerWallet: ownerWallet }, async function (err, count) {
            if (count > 0) {
                let existData = await StakeSchema.findOne({ ownerWallet: ownerWallet });
                let mintList = existData.mint;
                const idx = mintList.findIndex(item => item.mint == nft)
                // const idx = mintList.indexOf(nft);
                if (idx > -1) {
                    mintList.splice(idx, 1);
                }
                if (mintList.length == 0) {
                    await StakeSchema.deleteOne({ ownerWallet: ownerWallet });
                } else {
                    existData.mint = mintList;
                    await existData.save();
                }
            }
        })

        res.json({
            result: true,
        })

    } catch (err) {
        res.json({
            result: false,
        })
    }
})

app.post('/getHolders', async (req, res) => {
    console.log(`here`);
    // const filter = {};
    let holders = await StakeSchema.find();
    console.log(holders);
    res.json({
        result: holders
    })
});

app.post('/getMetricsInfo', async (req, res) => {
    let holders = await StakeSchema.find().sort({ stakeTime: '-1' });
    let wobCount = 0;
    holders.forEach((item) => {
        wobCount += item.mint.length;
    })
    let bronzeCount = 0
    let silverCount = 0
    let goldCount = 0
    let curtime = new Date().getTime();
    console.log(`curtime::`, curtime);


    let mintList = [];
    let recentList = [];
    let avatarList = [];
    let avatarListRes = [];
    holders.forEach(item => {
        avatarList.push(UserSchema.findOne({ address: item.ownerWallet }))
    })
    avatarListRes = await Promise.all(avatarList);
    console.log(`avatarlistjob::`, avatarListRes);
    holders.forEach((item, idx) => {
        item.mint.forEach(eleitem => {
            mintList.push({
                mint: eleitem.mint,
                stakeTime: eleitem.stakeTime,
                ownerWallet: item.ownerWallet,
                image_url: avatarListRes[idx] == null ? '' : avatarListRes[idx].image_url
            })
            let interval = (new Date().getTime() - new Date(eleitem.stakeTime).getTime()) / 1000;
            recentList.push({
                mint: eleitem.mint,
                stakeTime: eleitem.stakeTime,
                ownerWallet: item.ownerWallet,
                interval: interval,
                image_url: avatarListRes[idx] == null ? '' : avatarListRes[idx].image_url
            })
        })
    })

    recentList.forEach((item) => {
        let thistime = new Date(item.stakeTime).getTime();
        let interval = (curtime - thistime) / (1000 * DAY_TIME);
        if (interval >= 90) {
            goldCount++;
        } else if (interval >= 60 && interval < 90) {
            silverCount++;
        } else if (interval >= 30 && interval < 60) {
            bronzeCount++;
        }
    })

    // recentList = mintList;
    recentList.sort((a, b) => (a.stakeTime < b.stakeTime ? 1 : -1));
    recentList = recentList.splice(0, 5);

    mintList.sort((a, b) => (a.stakeTime > b.stakeTime ? 1 : -1));
    mintList = mintList.splice(0, 5);

    res.json({
        'result': recentList,
        'wobCount': wobCount,
        'goldCount': goldCount,
        'silverCount': silverCount,
        'bronzeCount': bronzeCount,
        'leaderboard': mintList
    })
})

app.post('/updateProfile', async (req, res) => {

    const { email, address } = req.body;
    const { file } = req.files;
    console.log('file:::', req.body);   

    fs.writeFileSync(`src/avatar/${address}-${file.name}`, file.data, function (err) {
        if (err) { throw err; return; }
    });

    cloudinary.uploader.upload(
        `src/avatar/${address}-${file.name}`,
        {
            folder: 'wob_staking'
        }
    ).then(async (result) => {
        let url = result.url;
        console.log(`url::`, url);
        UserSchema.countDocuments({
            address: address
        }, async function (err, count) {
            console.log(`count:::`, count);
            if (count == 0) {
                const newData = new UserSchema({
                    address: address,
                    email: email,
                    image_url: url
                });
                const saveData = await newData.save();
                if (!saveData) {
                    res.json({
                        result: false
                    })
                    throw new Error("Database Error");
                }
                res.json({
                    result: true
                })
            } else {
                let existData = await UserSchema.findOne({ address: address });
                existData.address = address;
                existData.email = email;
                existData.image_url = url;
                await existData.save();
                res.json({
                    result: true
                })
            }
        })
    }).catch(async (err) => {
        console.log(`upload err::`, err);
        res.json({
            result: false
        })
    });

})

app.post('/getProfile', async (req, res) => {
    const { address } = req.body;
    const data = await UserSchema.findOne({ address: address });
    res.json({
        result: data
    })
})

app.post('/deleteProfile', async (req, res) => {
    const { address } = req.body;
    console.log(`address:`, address);
    UserSchema.countDocuments({ address: address }, async function (err, count) {
        console.log(`acount::`, count);
        if (count > 0) {
            const existData = await UserSchema.findOne({ address: address });
            await existData.delete();
            res.json({
                result: 'success'
            })

        } else {
            res.json(
                { result: true }
            )
        }
    })

})

app.listen(PORT, () => console.log(`App listening at port ${PORT}`));
