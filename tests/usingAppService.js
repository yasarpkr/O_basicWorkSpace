// IMPORTS
const {getText, getAttribute, click, rClick, select, sendKeys, find,notFind, goWindow,  wait, now, log, scroll} = require('../services/sente');
const {Builder, By, Key, until, webdriver,WebDriver,contextClick} = require('selenium-webdriver');
const {testFlow,login} = require('../services/app-services');
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


    login('sente','1');
    

}

testFlow(test);