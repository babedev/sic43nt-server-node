﻿/*
 * LICENSE: The MIT License (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://github.com/SiliconCraft/sic43nt-server-node/blob/master/LICENSE.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @copyright 2018 Silicon Craft Technology Co.,Ltd.
 * @license   https://github.com/SiliconCraft/sic43nt-server-node/blob/master/LICENSE.txt
 * @link      https://github.com/SiliconCraft/sic43nt-server-node
 *
 */

'use strict';

var express = require('express');
var router = express.Router();
var ks = require('../utils/keystream');

var pg = require('pg');

/* GET home page. */
router.get('/', function (req, res) {
    var rawData = "";

    var uid = "";
    var defaultKey = "";
    var flagTamperTag = "";
    var timeStampTag = "";
    var rollingCodeTag = "";

    var flagTamperServer = "N/A";
    var timeStampServer = "N/A";
    var rollingCodeServer = "N/A";

    var flagTamperDecision = "N/A";
    var timeStampTagDecision = "N/A";
    var rollingCodeDecision = "N/A";


    if (req.query !== null) {
        if (typeof req.query.d === 'string') {
            rawData = req.query.d.toUpperCase();
            uid = rawData.substring(0, 14);                     /* Extract UID */
            defaultKey = "010203" + uid;                        /* Use Default Key ("FFFFFF" + UID) */
            flagTamperTag = rawData.substring(14, 14 + 2);      /* Extract Tamper Flag */
            var tmp_timeStampTag = rawData.substring(16, 16 + 8);
            if (tmp_timeStampTag !== "") {                      /* Extract Time Stamp and Check the content*/
                timeStampTag = parseInt(tmp_timeStampTag, 16);

                /* Extract Rolling Code from Tag */
                rollingCodeTag = rawData.substring(24, 24 + 8);
                /* Calculate Rolling code from Server */
                rollingCodeServer = ks.keystream(ks.hexbit(defaultKey), ks.hexbit(tmp_timeStampTag), 4);
            }

            if (rollingCodeTag === rollingCodeServer) {
                rollingCodeDecision = "Correct";
            } else {
                rollingCodeDecision = "Incorrect";
            }
        }
    }

    res.render('index', {
        title: 'SIC43NT Demonstration',
        uid: uid,
        defaultKey: defaultKey,
        flagTamperTag: flagTamperTag,
        flagTamperServer: flagTamperServer,
        flagTamperDecision: flagTamperDecision,
        timeStampTag: timeStampTag,
        timeStampServer: timeStampServer,
        timeStampDecision: timeStampTagDecision,
        rollingCodeTag: rollingCodeTag,
        rollingCodeServer: rollingCodeServer,
        rollingCodeDecision: rollingCodeDecision
    });
});

router.get('/send', (req, res) => {
    var rawData = "";

    var uid = "";
    var defaultKey = "";
    var flagTamperTag = "";
    var timeStampTag = "";
    var rollingCodeTag = "";

    var flagTamperServer = "N/A";
    var timeStampServer = "N/A";
    var rollingCodeServer = "N/A";

    var flagTamperDecision = "N/A";
    var timeStampTagDecision = "N/A";
    var rollingCodeDecision = "N/A";


    if (req.query !== null) {
        if (typeof req.query.d === 'string') {
            rawData = req.query.d.toUpperCase();
            uid = rawData.substring(0, 14);                     /* Extract UID */
            defaultKey = "010203" + uid;                        /* Use Default Key ("FFFFFF" + UID) */
            flagTamperTag = rawData.substring(14, 14 + 2);      /* Extract Tamper Flag */
            var tmp_timeStampTag = rawData.substring(16, 16 + 8);
            if (tmp_timeStampTag !== "") {                      /* Extract Time Stamp and Check the content*/
                timeStampTag = parseInt(tmp_timeStampTag, 16);

                /* Extract Rolling Code from Tag */
                rollingCodeTag = rawData.substring(24, 24 + 8);
                /* Calculate Rolling code from Server */
                rollingCodeServer = ks.keystream(ks.hexbit(defaultKey), ks.hexbit(tmp_timeStampTag), 4);
            }

            if (rollingCodeTag === rollingCodeServer) {
                const client = new pg.Client({
                    connectionString: process.env.DATABASE_URL,
                    ssl: {
                        rejectUnauthorized: false
                    }
                });

                client.connect();

                client.query('BEGIN', err => {
                    if (err) {
                        res.json({
                            error: err
                        })
                    } else {
                        const insertLog = 'INSERT INTO nfcs(uid, default_key) VALUES ($1, $2)';
                        client.query(insertLog, (err, _) => {
                            if (err) {
                                res.json({
                                    error: 'Failed'
                                });
                            } else {
                                client.query('COMMIT', err => {
                                    if (err) {
                                        res.json({
                                            error: 'Failed commit'
                                        });
                                    }
                                });
                            }
                        });
                    }
                });

                rollingCodeDecision = "Correct";

                res.json({
                    uid: uid,
                    default_key: defaultKey,
                    flag_tamper_tag: flagTamperTag,
                    flag_tamper_server: flagTamperServer,
                    flag_tamper_decision: flagTamperDecision,
                    time_stamp_tag: timeStampTag,
                    time_stamp_server: timeStampServer,
                    time_stamp_decision: timeStampTagDecision,
                    rolling_code_tag: rollingCodeTag,
                    rolling_code_server: rollingCodeServer,
                    rolling_code_decision: rollingCodeDecision
                })
            } else {
                rollingCodeDecision = "Incorrect";

                res.json({
                    error: 'Rolling code incorrect'
                })
            }
        } else {
            res.json({
                error: 'Missing parameters'
            })
        }
    } else {
        res.json({
            error: 'Missing parameters'
        })
    }
});

module.exports = router;
