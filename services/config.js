// IMPORTS


// _____________________________________________________________________________________________________________________
// VARIABLES DEFINATIONS
let config = {};
config.senteHost='http://127.0.0.1:3000';
config.getParametersEndPoint=config.senteHost+'/rest/gettestparameters';
config.newReservation=config.senteHost+'/rest/newreservation';
config.getReservation=config.senteHost+'/rest/getreservation';
config.updateReservationStatus=config.senteHost+'/rest/updatereservationstatus';
config.updateTestRunStatus=config.senteHost+'/rest/updatetestrunstatus';
config.screenshotPath='/home/selcuk/Downloads';
config.defaultDelay=20000;
config.downloadPath='/home/sente/downloads';
config.testTimeOut=20 ; // Test Timeout (minutes)
config.folderSlash='/';
config.testerMode=true;









// _____________________________________________________________________________________________________________________
// EXPORT
module.exports=config;
