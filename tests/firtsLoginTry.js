// IMPORTS
const {getText, getAttribute, click, rClick, select, sendKeys, find,notFind, goWindow,  wait, now, log, scroll} = require('../services/sente');
const {Builder, By, Key, until, webdriver,WebDriver,contextClick} = require('selenium-webdriver');
const {testFlow} = require('../services/app-services');
const { driverType } = require('./parameters');
const ns = require('../services/sente');
global.param = require('./parameters');



// _____________________________________________________________________________________________________________________
// VARIABLES DEFINATIONS



// _____________________________________________________________________________________________________________________
// TEST-SPECIFIC PARAMETER DEFINATIONS



// _____________________________________________________________________________________________________________________
// TEST FLOW

let test = async() =>{

    // Test Codes in here
    // driver.get(url)
    // click
    // rClick
    // sendKeys
    // find
    // notFind
    // getText
    // getAttribute
    // scroll
    // wait
    // log
    // goWindow


    await driver.get(param.ulakUrl);
    //await driver.get('http://192.168.240.194/portal');
    //await ns.find.id('oamusr');
    //await find.id(search: 'oamusr');
    await sendKeys.id('oamusr',[param.ulakUser[0]]);
    await sendKeys.id('oampss',[param.ulakUser[1],Key.RETURN]);
    // await click.xpath(`//button[@type='submit']`);
    //await click.text(' Login')
    //button[@type='submit']
    await find.xpath(`//*[@ref='page/search/enodebSearch.jsp']`,5000);
}

testFlow(test);