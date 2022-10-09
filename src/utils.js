import { v2 } from "cloudinary";
import { RandomNumberSchema } from "./model";
import reRollList from './pair.json';
import axios from "axios";
import { RerollSchema } from "./model";

const { exec } = require("child_process");

const random = async (deep, prevNumber, res, address, wallet) => {
    let number = Math.floor(Math.random() * 15);
    console.log(`randome gen::`, number);
    if (deep > 10) {
        res.json({
            result: 'error'
        })
        return;
    }
    RandomNumberSchema.countDocuments({ number: number }, async function (err, count) {
        if (err) {
            res.json({
                result: 'error'
            })
            return;
        }
        if (count > 0) {
            await random(deep + 1, prevNumber, res, address, wallet);
        } else if (count == 0) {
            const data = new RandomNumberSchema({ number: number });
            await data.save();
            if (prevNumber != -1) {
                const prevData = await RandomNumberSchema.findOne({ number: prevNumber });
                if (prevData) await prevData.delete();
            }
            console.log('return value::', number);
            let uri = reRollList[number];
            let cmd = `metaboss update uri --keypair ./update_key.json --account ${address} --new-uri ${uri}`;
            let cmd1;
            
            try {
                let metaJson = await axios.post(uri);
                let name = metaJson.data.name;
                console.log(`name::`, name);
                cmd1 = `metaboss update name --keypair ./update_key.json --account ${address} --new-name "${name}"`
                
                console.log(`cmd1:::`, cmd1)
                try {
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

                            //store re-roll
                            RerollSchema.countDocuments({ownerWallet: wallet}, async function (err, count) {
                                try {
                                    if (count == 0) {
                                        const newData = new RerollSchema({
                                            ownerWallet: wallet,
                                            count: 1
                                        });
                                        await newData.save();
                                    } else {
                                        let existData = await RerollSchema.findOne({ownerWallet: wallet});
                                        let count = existData.count;
                                        existData.count = count + 1;
                                        await existData.save();
                                    }
                                    res.json({
                                        result: 'success',
                                        number: number
                                    })
                                } catch (err) {
                                    res.json({
                                        result: 'error',
                                    })
                                }
                            })

                            
                        })
                    });
                } catch (err) {
                    console.log(`err:`, err)
                    res.json({
                        result: 'metaboss update error'
                    })
                }
            } catch (err) {
                res.json({
                    result: 'post request error'
                })
            }
        }
    })
}

export {
    random
}