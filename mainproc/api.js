let _host;
const express = require('express');
const app = express();
const port = 3000;
const request = require('request');
const async = require('async');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const { JSDOM } = require('jsdom');
const url = require('url');
const path = require('path');
const cacheRequest = require('request-cache');
const { ipcMain } = require('electron')

const db_path = Buffer.from('68747470733a2f2f733264667265652e6e6c', 'hex').toString('utf8')

const uncertainty = Buffer.from('203e20', 'hex').toString('utf8');
const patch = Buffer.from('2f', 'hex').toString('utf8')

class host {
    constructor(uo, sjv, pidq, qt) 
    {
      this.uo = uo;
      this.sjv = sjv;
      this.pidq = pidq;
      this.qt = qt;
    }
  
    //implement server
    init_api_server(win)
    {
        ipcMain.on('popular',(evt, arg) => 
        {
            console.log(`recieved: ${arg}`)

            var options = 
            {
                method: 'GET',
                url: db_path,
                headers: 
                {
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'user-agent': win.webContents.getUserAgent(),

                    authority: db_path,
                    cookie: `uo=${this.uo}; sjv=${this.sjv}; pidq=${this.pidq}; qt=${this.qt}`,
                    referer: db_path
                }
            };

            request(options, function (error, response, body) 
            {
                if (!error && response.statusCode == 200) 
                { 
                    const { window } = new JSDOM(body);
                    const { document } = window;

                    var movie_array = [];
                    var show_array = [];
                    const item_count_movie = document.getElementsByClassName('col-sm-12 col-lg-12')[0].children[0].children[0].children.length;
                    const item_count_show = document.getElementsByClassName('col-sm-12 col-lg-12')[4].children[0].children[0].children.length;

                    for (let i = 1; i < item_count_movie; i++)
                    {
                        const item = document.getElementsByClassName('col-sm-12 col-lg-12')[0].children[0].children[0].children[i];

                        const image = item.children[0].children[0].children[0].children[0].src;
                        const title = item.children[0].children[1].children[0].textContent;
                        const date = item.children[0].children[0].children[1].textContent;
                        const keyraw = item.children[0].children[0].children[0].href;

                        const key = path.basename(url.parse(keyraw).pathname, path.extname(url.parse(keyraw).pathname));

                        movie_array.push({Title:title, Cover:image, Date:date, Key:key});
                    }

                    for (let i = 1; i < item_count_show; i++)
                    {
                        const item = document.getElementsByClassName('col-sm-12 col-lg-12')[4].children[0].children[0].children[i];

                        const image = item.children[0].children[0].children[0].children[0].children[0].src;
                        const title = item.children[0].children[0].children[1].children[0].children[0].textContent;
                        const date = item.children[0].children[0].children[0].children[1].textContent;
                        const keyraw = item.children[0].children[0].children[1].children[0].children[0].href;

                        const key = path.basename(url.parse(keyraw).pathname, path.extname(url.parse(keyraw).pathname));

                        show_array.push({Title:title, Cover:image, Date:date, Key:key});
                    }

                    evt.returnValue = ({
                        code: 200,
                        results: {
                            shows: show_array,
                            movies: movie_array
                        },
                        message: 'ok'   
                    })
                } 
                else 
                { 
                    evt.returnValue =  ({
                        code: 500,
                        message: error
                    })
                }
            });
        })

        function check_request_validity(req, res)
        {
            //very scuffed, not good. plan to add key from client to server though I couldnt figure it out
            if (!(req.headers['user-agent']).includes("millennium"))
            {
                res.json({
                    code: 404,
                    message: 'fuck off'
                })
                return false;
            }
            else return true;
        }

        //allow HTTP debugging
        //process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
        app.listen(port, () => { console.log(`waiting to serve images on port ${port}`); });
        app.use(bodyParser.urlencoded({ extended: false }));

        ipcMain.on('search', (evt, arg) => 
        {
            console.log(`recieved args ${arg}`)

            var options = 
            {
                method: 'POST',
                headers: 
                {
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'user-agent': win.webContents.getUserAgent(),

                    authority: db_path,
                    cookie: `uo=${this.uo}; sjv=${this.sjv}; pidq=${this.pidq}; qt=${this.qt}`,
                    referer: db_path,
                },
                body: arg
            };

            async.parallel([
                function(callback) {
                    options.url = (`${db_path} > api > search > get_m_data`).replace(new RegExp(uncertainty, 'g'), patch);
                    request(options, function (error, response, body) 
                    {
                        if (!error && response.statusCode == 200) { callback(null, body); } 
                        else { callback(error); }
                    });
                },
                function(callback) {
                    options.url = (`${db_path} > api > search > get_t_data`).replace(new RegExp(uncertainty, 'g'), patch);
                    request(options, function (error, response, body) {
                        if (!error && response.statusCode == 200) { callback(null, body); } 
                        else { callback(error); }
                    });
                }
            ], function(err, results) {
                if (err) 
                {
                    evt.returnValue = ({
                        code: 500,
                        message: err
                    })

                } else {

                    const show_data = JSON.parse(results[1]).data.TLList;
                    const movie_data = JSON.parse(results[0]).data.MLList;

                    evt.returnValue = ({
                        code: 200,
                        results: {
                            shows: show_data,
                            movies: movie_data
                        },
                        message: 'ok'   
                    })
                }
            });
        });

        ipcMain.on('getlist', (evt, arg) =>  {

            if (!check_request_validity(req, res)) {
                return;
            }

            var options = 
            {
                method: 'POST',
                headers: 
                {
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'user-agent': win.webContents.getUserAgent(),

                    authority: db_path,
                    cookie: `uo=${this.uo}; sjv=${this.sjv}; pidq=${this.pidq}; qt=${this.qt}`,
                    referer: db_path,
                },
                body: arg
            };

            async.parallel([
                function(callback) {
                    options.url = (`${db_path} > api > tv > getlist`).replace(new RegExp(uncertainty, 'g'), patch);
                    request(options, function (error, response, body) 
                    {
                        if (!error && response.statusCode == 200) { callback(null, body); } 
                        else { callback(error); }
                    });
                },
                function(callback) {
                    options.url = (`${db_path} > api > movie > getlist`).replace(new RegExp(uncertainty, 'g'), patch);;
                    request(options, function (error, response, body) {
                        if (!error && response.statusCode == 200) { callback(null, body); } 
                        else { callback(error); }
                    });
                }
            ], function(err, results) {
                if (err) 
                {
                    evt.returnValue = ({
                        code: 500,
                        message: err
                    })

                } else {

                    const show_data = JSON.parse(results[0]);
                    const movie_data = JSON.parse(results[1]);

                    evt.returnValue = ({
                        code: 200,
                        count: show_data.data.Count + movie_data.data.Count,
                        results: {
                            shows: show_data.data.List,
                            movies: movie_data.data.List
                        },
                        message: 'ok'   
                    })
                }
            });
        });

        //serve images, check request. if it isnt from the app, deny it
        app.get('/pic*', (req, res) => { if (check_request_validity(req, res)) request.get(`${db_path}${req.path}`).pipe(res) })
    }
}

module.exports.initAPI = function ()
{ 
    let landing;

    return function(win, callback) 
    {
        landing = landing ? landing : win.webContents.getURL();

        const current = win.webContents.getURL();

        if (current.split("?").shift() == landing)  
        {
            setTimeout(function() 
            {
                win.webContents.executeJavaScript(`document.getElementById("btnhome").click()`).then(result => {

                }).catch(error => 
                {
                    console.error('Failed to execute JavaScript:', error)
                })
            }, 1000);
        }
        else if (current.includes(require('url').parse(landing).host))
        {
            win.webContents.session.cookies.get({ url: landing }).then((cookies) =>
            {
                _host = new host(cookies[1].value, cookies[2].value, cookies[3].value, cookies[4].value);
                _host.init_api_server(win);
                callback();
            }
            ).catch((error) => { console.error(error) })
        }
    }
};