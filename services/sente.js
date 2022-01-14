// IMPORTS
const config = require('./config');
const {Builder, By, Key, until, webdriver,WebDriver,Capabilities} = require('selenium-webdriver');
const _http = require('selenium-webdriver/http');
const axios = require('axios');
const sql = require('mssql');
const dateTime = require('node-datetime');
const parser = require('fast-xml-parser');
const fs = require('fs');
const random = require('random');
const extract = require('extract-zip');
const { Client } = require('pg');
const path = require("path");
const child_process = require('child_process').exec;
const node_ssh = require('node-ssh');
const firefox = require('selenium-webdriver/firefox');
const db =require('mysql');


// _____________________________________________________________________________________________________________________
// VARIABLES DEFINATIONS
let ns = {};



ns.buildDriver = async (browserType) => {
    try {
        let drv;
        if (param.testrunid && !param.serverUrl) param= await ns.browserReservation(browserType,param);

        let retry=0;
        do{
            try{
                retry++;

                console.log(`Driver starting => ${param.serverUrl}   [Try: ${retry}]`);
                await ns.killAllSessions(param.serverUrl); await ns.wait(2000);
                switch (browserType) {
                    case 'firefox':
                        // param.downloadPath = await ns.setDownloadPath();
                        const options = new firefox.Options(); //More Info: https://www.selenium.dev/selenium/docs/api/javascript/module/selenium-webdriver/firefox.html
                        // options.setPreference("browser.download.dir",param.downloadPath)
                        options.setPreference("browser.download.folderList",2) // 0 means to download to the desktop, 1 means to download to the default "Downloads" directory, 2 means to use the directory you specify in "browser.download.dir"
                        options.setPreference("browser.download.manager.showWhenStarting", false)
                        options.setPreference("browser.helperApps.neverAsk.saveToDisk","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv") //More Info: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
                        options.setPreference("browser.helperApps.alwaysAsk.force", false)



                        drv = await new Builder()
                            .forBrowser(browserType)
                            .setFirefoxOptions(options)

                            .usingServer(param.serverUrl)
                            .withCapabilities(Capabilities.firefox()
                                .set("acceptInsecureCerts", true)
                                .set("acceptSslCerts", true))

                            .build();



                        break;
                    default:
                        drv = await new Builder()
                            .forBrowser(browserType)
                            .usingServer(param.serverUrl)
                            .setChromeOptions({args: ['--disable-web-security','--ignore-certificate-errors', '--ignore-ssl-errors=yes'], timeouts:{ implicit: 0, pageLoad:5000000, script: 30000 }, w3c: false})
                            .build();
                        // await drv.setDownloadPath(config.downloadPath);
                        break;
                }

                await drv.manage().deleteAllCookies();
                let session = await drv.getSession();
                param.sessionid=session.id_;

                if (param.testrunid) ns.updateReservationStatus(param,2);
                await drv.manage().window().maximize();
                await ns.wait(2000);param.drv=drv;global.drv=drv;
                retry=4;
                break;
            }
            catch (e) {
                console.log(e);
                console.log(`Build driver failed [Try: ${retry}]`);
                console.log(`Waiting 10 seconds for retry`)
                await ns.wait(10000);
                if(retry ===3) throw new Error(e);
            }

        }while(retry<=3)






        return Promise.resolve(param.drv);
    }
    catch (e) {
        return Promise.reject(e);
    }

};

ns.execQuery =  (query,connectionParameters=param.dbConnPar)=>{
    return new Promise(async (resolve,reject)=>{

        let dBConfig ={
            host: connectionParameters[0],
            port: parseInt(connectionParameters[1]),
            database: connectionParameters[2],
            user: connectionParameters[3],
            password: connectionParameters[4]
        };
        //parameters.dBConfig = { host: '192.168.21.96', user: 'root', password: 'Argela123*', database: 'cem'};

        console.log('Exec Query: '+query);
        let conn = await db.createConnection(dBConfig);
        await conn.connect();

        conn.query({sql: `${query};`}, (err,results,fields)=>{
            if(!err) {
                conn.end();
                console.log('            OK');
                resolve(results);
            }
            else {
                conn.end();
                reject(err);
            }

        });

    });
};

ns.sendKey = async (key) => {
    await param.drv.sleep(500);param.drv.findElement(By.css("body")).sendKeys(key);await param.drv.sleep(500);
};

findObject= async(search,type,delay) => {
    let returnObject={};
    let wait=config.defaultDelay;
    if(delay) wait=delay;
    try{
        switch (type) {
            case 'id':
                returnObject= await param.drv.wait(until.elementLocated(By.id(search)),wait);
                break;
            case 'text':
                returnObject= await param.drv.wait(until.elementLocated(By.xpath(`//*[contains(text(), '${search}')]`)),wait);
                break;
            case 'href':
                returnObject= await param.drv.wait(until.elementLocated(By.xpath(`//*[@href ='${search}']`)),wait);
                break;
            case 'xpath':
                returnObject= await param.drv.wait(until.elementLocated(By.xpath(`${search}`)),wait);
                break;
            case 'option':
                returnObject= await param.drv.wait(until.elementLocated(By.xpath(`//option[@value='${search}']`)),wait);
                break;
            case 'value':
                returnObject= await param.drv.wait(until.elementLocated(By.xpath(`//*[@value='${search}']`)),wait);
                break;
            case 'name':
                returnObject= await param.drv.wait(until.elementLocated(By.xpath(`//*[@name='${search}']`)),wait);
                break;

        }
        return Promise.resolve(returnObject);

    }
    catch (e) {
        throw new Error(e);
    }

}

ns.getText = async (search,type,delay) => {
    try{
        if(!type) type='xpath';
        console.log('Get Text From =>'+search);
        let object=await findObject(search,type,delay);
        let objectText= await object.getText();
        // await ns.wait(500);
        console.log('                 => '+objectText);
        return Promise.resolve(objectText);
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.getText.id = async (search,delay) => {
    try{
        return Promise.resolve(await ns.getText(search,'id',delay));
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.getText.text = async (search,delay) => {
    try{
        return Promise.resolve(await ns.getText(search,'text',delay));
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.getText.href = async (search,delay) => {
    try{
        return Promise.resolve(await ns.getText(search,'href',delay));
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.getText.xpath = async (search,delay) => {
    try{
        return Promise.resolve(await ns.getText(search,'xpath',delay));
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.getText.value = async (search,delay) => {
    try{
        return Promise.resolve(await ns.getText(search,'value',delay));
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.getText.name = async (search,delay) => {
    try{
        return Promise.resolve(await ns.getText(search,'name',delay));
    }
    catch (e) {
        throw new Error(e);
    }


};

ns.getAttribute = async (search,type,attribute,delay) => {
    try{
        if(!type) type='xpath';
        console.log('Get "'+attribute+'" From =>'+search);
        let object=await findObject(search,type,delay);
        let objectText= await object.getAttribute(attribute);
        await ns.wait(500);
        console.log('                 => '+attribute+'= '+objectText);
        return Promise.resolve(objectText);
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.getAttribute.id = async (search,attribute,delay) => {
    try{
        return Promise.resolve(await ns.getAttribute(search,'id',attribute,delay));
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.getAttribute.text = async (search,attribute,delay) => {
    try{
        return Promise.resolve(await ns.getAttribute(search,'text',attribute,delay));
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.getAttribute.href = async (search,attribute,delay) => {
    try{
        return Promise.resolve(await ns.getAttribute(search,'href',attribute,delay));
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.getAttribute.xpath = async (search,attribute,delay) => {
    try{
        return Promise.resolve(await ns.getAttribute(search,'xpath',attribute,delay));
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.getAttribute.value = async (search,attribute,delay) => {
    try{
        return Promise.resolve(await ns.getAttribute(search,'value',attribute,delay));
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.getAttribute.name = async (search,attribute,delay) => {
    try{
        return Promise.resolve(await ns.getAttribute(search,'name',attribute,delay));
    }
    catch (e) {
        throw new Error(e);
    }


};

ns.click = async (search,type,delay) => {
    if(!type) type='xpath';
    console.log('Click =>'+search);
    try{
        let object=await findObject(search,type,delay);
        await object.click();
        await ns.wait(1000);

        // wait overlay
        let overlayStatus=0;
        do{
            try {
                await param.drv.wait(until.elementLocated(By.xpath(`//img[@id='loadingImg']`)),1000);
                await ns.wait(1000);
                overlayStatus++;
            }
            catch (e) { overlayStatus = 121; }
        } while(overlayStatus<120)
        //

        // wait overlay
        let overlayStatus2=0;
        do{
            try {
                await param.drv.wait(until.elementLocated(By.xpath(`//div[@class='blockUI']`)),1000);
                await ns.wait(1000);
                overlayStatus2++;
            }
            catch (e) { overlayStatus2 = 121; }
        } while(overlayStatus2<120)
        //
        return Promise.resolve(object);
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.click.id = async (search,delay) => {
    try{
        return Promise.resolve(await ns.click(search,'id',delay));
    }
    catch (e) {
        throw new Error(e);
    }

};
ns.click.text = async (search,delay) => {
    try{
        return Promise.resolve(await ns.click(search,'text',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.click.href = async (search,delay) => {
    try{
        return Promise.resolve(await ns.click(search,'href',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.click.xpath = async (search,delay) => {
    try{
        return Promise.resolve(await ns.click(search,'xpath',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.click.value = async (search,delay) => {
    try{
        return Promise.resolve(await ns.click(search,'value',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.click.option = async (optionValue,delay) => {
    try{
        return Promise.resolve(await ns.click(optionValue,'option',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.click.name = async (optionValue,delay) => {
    try{
        return Promise.resolve(await ns.click(optionValue,'name',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};

ns.rClick = async (search,type,delay) => {
    if(!type) type='xpath';
    console.log('Right Click =>'+search);
    try{
        let object=await findObject(search,type,delay);
        await param.drv.actions().contextClick(object).perform();
        await ns.wait(1000);

        return Promise.resolve(object);
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.rClick.id = async (search,delay) => {
    try{
        return Promise.resolve(await ns.rClick(search,'id',delay));
    }
    catch (e) {
        throw new Error(e);
    }

};
ns.rClick.text = async (search,delay) => {
    try{
        return Promise.resolve(await ns.rClick(search,'text',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.rClick.href = async (search,delay) => {
    try{
        return Promise.resolve(await ns.rClick(search,'href',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.rClick.xpath = async (search,delay) => {
    try{
        return Promise.resolve(await ns.rClick(search,'xpath',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.rClick.value = async (search,delay) => {
    try{
        return Promise.resolve(await ns.rClick(search,'value',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.rClick.option = async (optionValue,delay) => {
    try{
        return Promise.resolve(await ns.rClick(optionValue,'option',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.rClick.name = async (optionValue,delay) => {
    try{
        return Promise.resolve(await ns.rClick(optionValue,'name',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};


ns.select = async (Select_Id_or_Name,Option_Value_or_Text) => {
    try{
        return Promise.resolve(await ns.click.xpath(`//select[@id="${Select_Id_or_Name}"]//option[@value=${Option_Value_or_Text}] | //select[@id="${Select_Id_or_Name}"]//option[contains(text(),'${Option_Value_or_Text}')] | //select[@name="${Select_Id_or_Name}"]//option[@value=${Option_Value_or_Text}] | //select[@name="${Select_Id_or_Name}"]//option[contains(text(),'${Option_Value_or_Text}')] `));
    }
    catch (e) {
        throw new Error(e);
    }
};


ns.sendKeys = async (search,keys,type,delay) => {
    if(!type) type='xpath';
    console.log(`Send Key "${keys}" to "${search}"`);
    try{
        let object=await findObject(search,type,delay);
        await object.clear();

        if(Array.isArray(keys)){
            for(let key of keys) {
                await object.sendKeys(key);await ns.wait(500);
            }
        }
        else {await object.sendKeys(keys);await ns.wait(500);}

        await ns.wait(500);
        return Promise.resolve(object);
    }
    catch (e) {
        throw new Error(e);
    }


};
ns.sendKeys.id = async (search,keys,delay) => {

    try{
        return Promise.resolve(await ns.sendKeys(search,keys,'id',delay));
    }
    catch (e) {
        throw new Error(e);
    }

};
ns.sendKeys.text = async (search,keys,delay) => {
    try{
        return Promise.resolve(await ns.sendKeys(search,keys,'text',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.sendKeys.href = async (search,keys,delay) => {
    try{
        return Promise.resolve(await ns.sendKeys(search,keys,'href',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.sendKeys.xpath = async (search,keys,delay) => {
    try{
        return Promise.resolve(await ns.sendKeys(search,keys,'xpath',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.sendKeys.value = async (search,keys,delay) => {
    try{
        return Promise.resolve(await ns.sendKeys(search,keys,'value',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};
ns.sendKeys.name = async (search,keys,delay) => {
    try{
        return Promise.resolve(await ns.sendKeys(search,keys,'name',delay));
    }
    catch (e) {
        throw new Error(e);
    }
};

ns.find = async (search,type,delay) => {
    if(!type) type='xpath';
    console.log('Find => '+search);
    try{
        let object=await findObject(search,type,delay);
        console.log('        Success\n');
        return Promise.resolve(object);
    }
    catch (e) {
        console.log('        Failed\n');
        throw new Error(e);
    }


};
ns.find.id = async (search,delay) => {
    try{
        return Promise.resolve(await ns.find(search,'id',delay));
    }
    catch (e) {
        throw new Error(e);
    }

};
ns.find.text = async (search,delay) => {
    try{
        return Promise.resolve(await ns.find(search,'text'));
    }
    catch (e) {
        throw new Error(e);
    }

};
ns.find.href = async (search,delay) => {
    try{
        return Promise.resolve(await ns.find(search,'href',delay));
    }
    catch (e) {
        throw new Error(e);
    }

};
ns.find.xpath = async (search,delay) => {
    try{
        return Promise.resolve(await ns.find(search,'xpath',delay));
    }
    catch (e) {
        throw new Error(e);
    }

};
ns.find.option = async (search,delay) => {
    try{
        return Promise.resolve(await ns.find(search,'option',delay));
    }
    catch (e) {

        throw new Error(e);
    }

};
ns.find.value = async (search,delay) => {
    try{
        return Promise.resolve(await ns.find(search,'value',delay));
    }
    catch (e) {

        throw new Error(e);
    }

};
ns.find.name = async (search,delay) => {
    try{
        return Promise.resolve(await ns.find(search,'name',delay));
    }
    catch (e) {

        throw new Error(e);
    }

};

ns.notFind = async (search,type,delay=5000) => {
    await ns.wait(1000);
    if(!type) type='xpath';
    console.log('NotFind => '+search);
    let success = false;

    try{
        let object=await findObject(search,type,delay);
        console.log('        Failed\n');

    }
    catch (e) {
        success=true;
        console.log('        Success\n');
    }

    if(success)  {return Promise.resolve(true);}
    else {throw new Error(search+' find success!');}


};
ns.notFind.id = async (search,delay) => {
    try{
        return Promise.resolve(await ns.notFind(search,'id',delay));
    }
    catch (e) {
        throw new Error(e);
    }

};
ns.notFind.text = async (search,delay) => {
    try{
        return Promise.resolve(await ns.notFind(search,'text',delay));
    }
    catch (e) {
        throw new Error(e);
    }

};
ns.notFind.xpath = async (search,delay) => {
    try{
        return Promise.resolve(await ns.notFind(search,'text',delay));
    }
    catch (e) {
        throw new Error(e);
    }

};

ns.tableValidate = async (search,tableData=[],delay) => {
    try{
        let rowCount= tableData.length;
        let rowIndex=0;
        for ( let row of tableData )
        {
            rowIndex ++;
            let colIndex=0;
            let colCount=row.length;

            for (let col of row) {
                colIndex++;
                let objectText = await ns.getText(`${search}/tr[${rowIndex}]/td[${colIndex}]`,'xpath',delay)
                if (objectText === col) console.log(`Table[${rowIndex},${colIndex}] ?=  ${col}  => SUCCESS \n`)
                else {throw new Error(`Table[${rowIndex},${colIndex}] ?=  ${col}  => FAILED \n`); }
                if(rowIndex === rowCount && colIndex === colCount ) return Promise.resolve('OK');

            }

        }

    }
    catch (e) {
        throw new Error(e);
    }

};
ns.barChartValidate = async (chart_xpath,values=[]) => {
    try{
        console.log(`Bar Charts Verifying => (${chart_xpath})`)
        let currentValues = [];
        let maxYAxisValue= await param.drv.findElement(By.xpath(`${chart_xpath}//*[contains(@class,"highcharts-yaxis-labels")]//*[*][last()]`)).getText();
        let maxY = await param.drv.findElement(By.xpath(`${chart_xpath}//*[contains(@class,"highcharts-series highcharts-series-")][1]//*[1]`)).getAttribute('y');
        let range = parseInt(maxY / maxYAxisValue ) ;

        let bars = await param.drv.findElements(By.xpath(`${chart_xpath}//*[contains(@class,"highcharts-series highcharts-series-")]//*[@height>0]`));
        for ( let bar of bars) {
            let currentValue = await bar.getAttribute('height');
            currentValues.push(parseInt(currentValue/range));
        }

        for ( let [index, value] of values.entries()){
            if(value === currentValues[index]) console.log(`   Value: ${value}  => Success`); else {console.log(`Bar Value: ${value}  => Not Validate`); throw new Error(`Bar Value: ${value}  => Failed`)}
            if(index+1 === values.length) return Promise.resolve('OK');
        }


    }
    catch (e) {
        console.log(e)
        throw new Error(e);
    }

};
ns.pieChartValidate = async (chart_xpath,values=[]) => {
    try{
        console.log(`Pie Charts Verifying => (${chart_xpath})`)

        for( let [index,value] of values.entries()){
            await ns.find.xpath(`${chart_xpath}//*[text()="${value.split(':')[1]}"]//..//*[text()="${value.split(':')[0]}"]`,10000)
        }

    }
    catch (e) {
        console.log(e)
        throw new Error(e);
    }

};




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


ns.pgExec = async (queryString,connectionParameters) => {
    // let client = await new Client({
    //     user: 'ulak_user',
    //     host: '192.168.240.28',
    //     database: 'ulak',
    //     password: 'argelatest1.',
    //     port: 5432
    // });
    let client = await new Client({
        host: connectionParameters[0],
        port: parseInt(connectionParameters[1]),
        database: connectionParameters[2],
        user: connectionParameters[3],
        password: connectionParameters[4]
    });
    console.log('Exec db query => '+queryString);
    try {
        return new Promise(async (resolve,reject)=>{
            await client.connect();
            await client.query(queryString, async (err, res)=>{
                await client.end();
                if(err) reject ('Postgre Error => '+err);
                resolve(res);
            });
        });

    }
    catch (e) {

        throw new Error('DB Hatası=> '+e)
    }
}
ns.runCommand = (command) =>{

    return new Promise((resolve, reject) => {
        child_process(command, function (error, stdout, stderr) {
            if (error !== null) {
                console.log('Error', 'Run Command : ' + command + '   OUTPUT => ' + error);
                reject(error);
            }
            else {
                console.log('Info', 'Run Command : ' + command + ', stdOut =>'+stdout + '  stdErr=>' +stderr );
                resolve(stdout + '\n'+'________________'+'\n' +stderr );
            }
        });
    });


}


ns.verify = async (type,search,delay) => {
    let returnObject={};
    let wait=config.defaultDelay;
    if(delay) wait=delay;
    try{
        switch (type) {
            case 'id':
                returnObject= await param.drv.wait(until.elementLocated(By.id(search)),wait);
                return Promise.resolve(returnObject);
                break;
            case 'text':
                returnObject= await param.drv.wait(until.elementLocated(By.xpath(`//*[contains(text(), '${search}')]`)),wait);
                return Promise.resolve(returnObject);
                break;
            case 'href':
                returnObject= await param.drv.wait(until.elementLocated(By.xpath(`//a[@href ='${search}']`)),wait);
                return Promise.resolve(returnObject);
                break;
            case 'xpath':
                returnObject= await param.drv.wait(until.elementLocated(By.xpath(`${search}`)),wait);
                return Promise.resolve(returnObject);
                break;
        }
        await param.drv.sleep(500);

    }
    catch (e) {
        throw new Error(e);
    }
};
ns.getdriver  = async (sessionId)=>{

    try {

        if (param.testrunid && param.inheritDriver==='true' ) {
            param.sessionid=sessionId;
            await ns.updateTestRunStatus(param,2);await ns.wait(1000);
            await ns.updateTestRunStatus(param,2);await ns.wait(1000);
        }

        param.drv = new WebDriver(
            sessionId,
            new _http.Executor(Promise.resolve(param.serverUrl)
                .then(
                    url => new _http.HttpClient(url, null, null))
            )
        );

        global.drv=param.drv;

        return Promise.resolve(param.drv);
    }
    catch (e) {
        return Promise.reject(e);
    }

};
ns.inputTextWithId = async (id,text) => {
    await param.drv.wait(until.elementLocated(By.id(id)),60000);
    await param.drv.findElement(By.id(id)).clear();await param.drv.sleep(500);
    await param.drv.findElement(By.id(id)).sendKeys(text);await param.drv.sleep(500);
    return param.drv.findElement(By.id(id));
};
ns.switchToWindow = async (orderNo) =>{
    let window=[];

    await param.drv.getAllWindowHandles().then(async d=>{
        if (orderNo==='last') {
            await param.drv.switchTo().window(d[(d.length-1)]);
            await window.push(d[orderNo]);
        }
        else {
            await param.drv.switchTo().window(d[orderNo]);
            await window.push(d[(d.length-1)]);

        }
    });

    await param.drv.sleep(2000);
    await param.drv.getTitle().then(d=>window.push(d));
    return window;
};
ns.goWindow = async (winTitle) =>{
    await console.log('\n=> "'+winTitle+'" penceresine geçiş yapılıyor');
    let winName="";
    let i;
    let w=[];
    do {
        winName= "";
        w=[];


        await param.drv.getAllWindowHandles().then(d=>w=d);
        // await console.log(`w = ${w.length} => ${w}`);

        for (i=0;i<w.length;i++)
        {
            await ns.switchToWindow(i).then( (d) => {
                // console.log(d);
                winName=d[1];
                // console.log(winName);
            });
            if(winName===winTitle) i=100;
        }

    }
    while(winName!==winTitle);
    await console.log('=> "'+winTitle+'" penceresine geçiş başarılı.');


};
ns.killExplorerOnNode= async (nodeProtocol,nodeIp) => {

    return axios.get(`${nodeProtocol}://${nodeIp}:3000/killall`, {
    })
        .then(async (res) => {
            console.log(`Killed Explorer on ${nodeProtocol}://${nodeIp}`);
            return Promise.resolve(true);
        })
        .catch((error) => {
            console.log(`ERROR Kill Explorer on ${nodeProtocol}://${nodeIp} ${error}`);
            return Promise.reject(error);

        })

}
ns.getNodeHostInfo= async (sessionid,hubhost) => {
    return axios.get(`${hubhost}/grid/api/testsession?session=${sessionid}`, {
    })
        .then(async (res) => {
            returnArray=[];
            let node=res.data.proxyId;
            let protocol=node.substr(0,node.indexOf(':'));
            let ip = (node.substr(node.indexOf(':')+3)).substr(0,(node.substr(node.indexOf(':')+3)).length-5);
            let port= node.substr(node.indexOf(':')+3).substr(node.substr(node.indexOf(':')+3).indexOf(':')+1,4);

            returnArray.push(protocol);
            returnArray.push(ip);
            returnArray.push(port);

            // console.log(returnArray);

            return Promise.resolve(returnArray);
        })
        .catch((error) => {
            return Promise.reject(error);
        })

}
ns.killExplorerOnRemoteMachine= async (hubhost) => {
    console.log('Explorer killing process on remote machine  started...');
    let baseHostUrl=hubhost.substr(0,10+hubhost.substr(10).indexOf('/'));
    console.log(`Hub Host: ${baseHostUrl}`);
    let nodeHostInfo= await param.drv.session_.then(_=> getNodeHostInfo(_.id_,baseHostUrl));
    console.log(`Node Host: ${nodeHostInfo}`);
    await ns.killExplorerOnNode(nodeHostInfo[0],nodeHostInfo[1]);
    return Promise.resolve();

}
ns.pushButton = async (text,buttonName) => {

    await param.drv.wait(until.elementLocated(By.xpath(`//span[contains(text(), '${text}')]`)),10000).then(async  d=>{
        await param.drv.sleep(1000);
        await param.drv.findElement(By.xpath(`//button[contains(text(), '${buttonName}')]`)).click();
    });

};
ns.getParameters= async (argv,timeout=config.testTimeOut) => {
    let timer = setTimeout(()=>{throw new Error(`Timeout: Test should have finished in ${timeout} minutes `);},1000*60*timeout);
    let interval = setInterval( () => {if(param.timerOff === true) {setTimeout(()=>{clearTimeout(timer); clearInterval(interval);},5000)}},5000);
    console.log(`Timeout set to ${timeout} minutes.`)

    param.export_data='';
    if(!param.setExportData) param.setExportData='';
    if(!param.drv) param.drv={};
    if(argv.testrunid>0) {
        param={};
        let testid=argv.testid;
        let environmentid= argv.environmentid;
        param.export_data='';
        param.setExportData='';
        param.drv={};
        param.testid=argv.testid;
        param.environmentid=argv.environmentid;
        param.groupid=argv.groupid;
        param.testrunid=argv.testrunid;
        param.timer=timer;
        await axios.post(config.getParametersEndPoint, {
            testid:testid,
            environmentid:environmentid,
            testrunid:argv.testrunid,
            language:'tr'
        })
            .then(async (res) => {
                for(let i of JSON.parse(JSON.stringify(res.data.parameters))){
                    param[i.name]=await ((i.value).toString().indexOf('_|_')===-1) ? i.value : i.value.split('_|_');

                }
                return await Promise.resolve(param);
            })
            .catch((error) => {
                return Promise.reject('Parametreler Senteden Getirilemedi: '+ error);
            })

    }
    else return param;



}
ns.errorHandle = async (error)=>{
    param.timerOff=true;
    try{error=JSON.stringify(error)}catch (e) {error=''}
    console.log(`\n\n========================\nTest Failed: ${error}\n========================\n`);
}

ns.wait= (milleseconds)=> {
    // ns.log('Wait: '+milleseconds+' ms');
    return new Promise(resolve => setTimeout(resolve, milleseconds))
}
ns.successHandle =  ()=>{
    param.timerOff=true;
    if(param.setExportData==='')param.setExportData=`"testStatus":"3"`; else param.setExportData=`"testStatus":"3" , ${param.setExportData} ${param.isDriverContinues==='true' ? ' ,"serverUrl":"'+param.serverUrl+'" , "driverid":"'+param.sessionid+'", "reservationid":"'+param.reservationid+'","downloadPath":"'+param.downloadPath+'"' :''}`;
    // param.setExportData=`"testStatus":"3"  ${param.setExportData === '' ? '' : ' , '+param.setExportData} ${param.isDriverContinues==='true' ? ' ,"serverUrl":"'+param.serverUrl+'" , "driverid":"'+param.sessionid+'", "reservationid":"'+param.reservationid+'","downloadPath":"'+param.downloadPath+'"' :''}`;

    console.log('\n\n============\nTest Success\n============\n');
    if(param.isDriverContinues!=='true' && !param.noDriver &&  !config.testerMode) {
        param.drv.quit();
        ns.deleteFolderRecursive(param.downloadPath);
    }
    if (param.testrunid) {
        ns.updateTestRunStatus(param,3);
        if(!param.noDriver) ns.updateReservationStatus(param,3);

    }
}
ns.browserReservation= async (browserType) => {
    let reservationid= await ns.addReservation(browserType,param.testid,param.groupid);
    await ns.wait(2000);
    let host;
    let loop;

    do {
        loop=false;
        host= await ns.getReservation(reservationid).catch(e=>loop=true);
        await ns.wait(5000);
    }while(loop===true);
    param.serverUrl=host;
    param.reservationid=reservationid;

    return Promise.resolve(param);





}
ns.addReservation= async (browserType,testid,groupid) => {

    return axios.post(config.newReservation, {
        testid:testid,
        groupid:groupid,
        type:browserType,
        language:'tr'
    })
        .then(async (res) => {
            if(res.data.status===true) {
                return Promise.resolve(res.data.reservationid);
            }
            else return Promise.reject('Reservation Error');

        })
        .catch((error) => {
            return Promise.reject('Reservation Error'+ error);
        })





}
ns.getReservation= async (reservationid) => {

    return axios.post(config.getReservation, {
        reservationid:reservationid,
        language:'tr'
    })
        .then(async (res) => {
            if(res.data.status===true) {
                return Promise.resolve(res.data.host);
            }
            else return Promise.reject('Reservation Error: ');

        })
        .catch((error) => {
            return Promise.reject('Reservation Error: '+ error);
        })





}
ns.updateReservationStatus= async (param,status) => {
    reservationid=param.reservationid;
    testrunid=param.testrunid;

    return axios.post(config.updateReservationStatus, {
        reservationid:reservationid,
        testrunid:testrunid,
        status:status,
        language:'tr'
    })
        .then(async (res) => {

            return Promise.resolve(true);

        })
        .catch((error) => {
            return Promise.reject('Reservation Error: '+ error);
        })





}
ns.updateTestRunStatus= async (param,status,scFileName) => {

    if(status!==4) scFileName='';
    return axios.post(config.updateTestRunStatus, {
        testrunid:param.testrunid,
        status:status,
        scFileName:scFileName,
        export_data:param.setExportData,
        language:'tr'
    })
        .then(async (res) => {
            return Promise.resolve(true);

        })
        .catch((error) => {
            return Promise.reject('Test Run Update Error: '+ error);
        })





}
ns.now = () =>{
    dt = dateTime.create();
    return dt.format('Y-m-d H:M:S');
}
ns.log = (description) =>{
    console.log(`\n=>${description}`);
}
ns.elog = (error) =>{
    console.log(`\n________________________________________\n=>${error}\n________________________________________\n`);
}
ns.parseXml = async (xmlPath)=>{
    try {
        let stream = await fs.readFileSync(xmlPath);
        let xmlData = await stream.toString();
        // if (parser.validate(xmlData) === true) {
        return await parser.parse(xmlData);
        // }

    }
    catch (e) {
        throw new Error(e);
    }


};
ns.scroll = async (xCoordinate=0,yCoordinate=100)=>{
    // let _y=100;
    // if(_y) _y=yCoordinate;
    try {
        await param.drv.executeScript(`window.scroll(${xCoordinate},${yCoordinate});`);
        await param.drv.sleep(100);

    }
    catch (e) {
        // throw new Error(e);
    }


};
ns.killAllSessions = async (hubHost) => {

    return axios({
        method: 'get',
        timeout: 5000,
        url: `${hubHost}/sessions`
    }, {})
        .then(async (res) => {
            // if (res.data.value.length > 0) return Promise.resolve(res.data.value.length);
            // else return Promise.resolve(0);

            if (res.data.value.length > 0) {
                for (let i of res.data.value ){

                    let drv = await ns.getdriver(i.id);

                    await drv.quit();

                }
                return Promise.resolve(true);
            }
            else return Promise.resolve(true)


        })
        .catch((error) => {
            console.log(error)
            return Promise.resolve(false);

        })


}
ns.killAllSessionsBeforeTestRun = async (hubHost) => {

    return axios({
        method: 'get',
        timeout: 5000,
        url: `${hubHost}/sessions`
    }, {})
        .then(async (res) => {
            // if (res.data.value.length > 0) return Promise.resolve(res.data.value.length);
            // else return Promise.resolve(0);

            if (res.data.value.length > 0) {
                for (let i of res.data.value ){

                    let drv = new WebDriver(
                        i.id,
                        new _http.Executor(Promise.resolve(param.serverUrl)
                            .then(
                                url => new _http.HttpClient(url, null, null))
                        )
                    );

                    // console.log(drv)
                    await ns.wait(1000)
                    await drv.close();

                }
                return Promise.resolve(true);
            }
            else return Promise.resolve(true)


        })
        .catch((error) => {
            console.log(error)
            return Promise.resolve(false);

        })


}
ns.getLastModifyFileName = async (filePath,fileType) => {
    let list=[];
    let count=0;
    await fs.readdir(filePath, function(err, files){
        console.log(files);
        files = files.map(function (fileName) {
            return {
                name: fileName,
                time: fs.statSync(filePath + '/' + fileName).mtime.getTime()
            };
        })
            .sort(function (a, b) {
                return b.time - a.time; })
            .map(function (v) {
                list.push(v.name) ;

            });
    });
    await ns.wait(1000);
    if (fileType) {
        for (let i of list){
            if (i.substr(-3)===fileType) {
                count=1;
                return i;
            }

        }
        if (count===0) return false;

    }
    else return list[0];
}
ns.getFilesInDirectory = async (filePath) => {
    let list=[];
    let count=0;
    await fs.readdir(filePath, function(err, files){
        console.log(files);
        files = files.map(function (fileName) {
            return {
                name: fileName,
                time: fs.statSync(filePath + '/' + fileName).mtime.getTime()
            };
        })
            .sort(function (a, b) {
                return b.time - a.time; })
            .map(function (v) {
                list.push(v.name) ;

            });
    });
    await ns.wait(1000);
    if (list.length!==0) return list;
    else return false;
}
ns.unzip_EX = async (file) => {
    try {
        extract(file,{dir: config.downloadPathOnSente},()=>{});
    }
    catch (e) {
        console.log(e);
        throw new Error(e);
    }
}
ns.unzip = async (file) => {
    try {
        extract(file,{dir: path.dirname(file)},()=>{});
    }
    catch (e) {
        console.log(e);
        throw new Error(e);
    }
}
ns.start = async (browserType,param) => {
    try {
        global.param={};
    }
    catch (e) {
        return Promise.reject(e);
    }

};

ns.sendGetRequest= async (url) => {

    console.log('\nGet Request => '+url);
    return axios.get(url)
        .then(async (res) => {
            return Promise.resolve(res);

        })
        .catch((error) => {
            return Promise.reject(error);
        })



}
ns.sendPostRequest= async (url,data={}) => {

    console.log('\nPost Request => '+url);
    console.log('Post Data:' );
    console.log(data);
    return axios.post(url,data)
        .then(async (res) => {
            return Promise.resolve(res);

        })
        .catch((error) => {
            return Promise.reject(error);
        })



}

ns.setDownloadPath=async () => {
    let downloadDirectoryName='S'+random.int(100000,999999)+''+random.int(100000,999999);
    if (!fs.existsSync(config.downloadPath+config.folderSlash+downloadDirectoryName)){
        await fs.mkdirSync(config.downloadPath+config.folderSlash+downloadDirectoryName);
        await fs.chmodSync(config.downloadPath+config.folderSlash+downloadDirectoryName, 0777);
    }

    // try{await param.drv.setDownloadPath(config.downloadPath+'/'+downloadDirectoryName+'/')}catch (e) {console.log('Download Path Bulunmadı!')}

    console.log(`Download Path Setted => ${config.downloadPath+config.folderSlash+downloadDirectoryName}`);
    return config.downloadPath+config.folderSlash+downloadDirectoryName;

}
ns.deleteFolderRecursive = (path) => {
    try{
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function(file, index){
                var curPath = path + config.folderSlash+ file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }
    catch (e) {
        console.log(e);
    }

};
ns.makeFolder = async (path) => {
    try{
        if (fs.existsSync(path)) {
            await fs.readdirSync(path).forEach(function(file, index){
                var curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            await fs.rmdirSync(path);
        }
        await fs.mkdirSync(path,{ recursive: true });
        return Promise.resolve(path);
    }
    catch (e) {
        console.log(e);
        return Promise.reject(false);
    }

};
ns.findFile = async (filename_,directory=param.downloadPath) => {

    console.log(`Searching "${filename_}" in [${directory}]`)
    let files = [];
    let result = false;
    files = await fs.readdirSync(directory);
    files.forEach((file, index) =>{
        if(file===filename_) {console.log('         => Success'); result=true; return Promise.resolve(result); }
        else if( file!==filename_ &&  files.length === index+1 && !result) throw new Error(`"${filename_}" not found in [${directory}]`)
    });

}







// _____________________________________________________________________________________________________________________
// EXPORT
module.exports=ns;
