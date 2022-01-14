// IMPORTS
const config = require('./config');
const {Builder, By, Key, until, webdriver,WebDriver} = require('selenium-webdriver');
const _http = require('selenium-webdriver/http');
const sql = require('mssql');
const dateTime = require('node-datetime');
const random = require('random');
const {getText,pgExec,log,select,find,click,sendKeys,wait,now,execQuery,getdriver,getParameters,errorHandle,successHandle,buildDriver} = require('./sente');
const node_ssh = require('node-ssh');
const fs = require('fs');
const readline = require('readline');
const os = require('os');
const argv = require('minimist')(process.argv.slice(2));


// _____________________________________________________________________________________________________________________
// VARIABLES DEFINATIONS
let ns = {};
let error=false;

// _____________________________________________________________________________________________________________________
// FUNCTION DEFINATIONS
ns.testFlow = async(callback,driverId) => {





    try {

        await getParameters(argv); //Parametreleri getir

            //handle driver
            if(param.inheritDriver==='true' && param.export_data!=='' && testStatus==='3') {
                param.serverUrl=await JSON.parse(param.export_data).serverUrl;
                param.reservationid=await JSON.parse(param.export_data).reservationid;
                driverid=await JSON.parse(param.export_data).driverid;
                await getdriver(driverid);
            }
            else if (driverId) {
                await getdriver(driverId);

            }
            else {
                await buildDriver(param.driverType); //Driver ı aç
            }

            global.driver=param.drv;
            await callback();



    }
    catch (e) {
        error=true;
        param.inheritDriver='false';
        errorHandle(param,e);
        console.log(e)

    }
    finally { if (!error) successHandle(param);
    }

};
ns.login = async(username,passsword) => {

    await driver.get(param.ulakUrl);
    await sendKeys.id('oamusr',username);
    await sendKeys.id('oampss',[passsword,Key.RETURN]);

};






// _____________________________________________________________________________________________________________________
// EXPORT
module.exports=ns;




