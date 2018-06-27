
function log(content){
  console.log(content);
}

function echo_header(){
  console.clear();
  console.log('Connection Stablished to ' + cObj.host);
      log('_________________________________________');
      log('|                                        ');
      log('|  User: ' + cObj.user                    );
      log('|  WorkSpace to Sync: ' + workSpace       );
      log('|________________________________________');
      log('');
}

function slog(act, content){
  var parseDateZero = function(d){
      if(d <= 9){
        d = '0'+d;
      }
      return d;
  }
  var dt = new Date();
    var cdt = parseDateZero(dt.getHours()) + ':' + parseDateZero(dt.getMinutes()) + ':' + parseDateZero(dt.getSeconds()) + ' } ';

    while(act.length < 15){
      act+= '_';
    }
  console.log(cdt + act + content);

}

    //Clear the Console
    console.clear();

    // DECLARATIONS

    try{
      //check the configs file

    }catch(e){
      log('\n"configs.json" File are missing...\n\n     Format: \n\n { \n   "host": "",\n   "user": "",\n   "password": ""\n } \n\n\n\n\n');
      process.exit();
    }

    const fs = require('fs');
    var Client = require('ftp');
    var dateTime = new Date();
    var cObj = require('./configs.json');
    var clientFTP = new Client();
    var workSpace = '/Users/sam/Dropbox/Saulo Breim/geral/localweb/project/';


    fs.watch(workSpace, { encoding: 'utf8', recursive: true}, (eventType, filename) => {
      var filepath = workSpace + filename;
      if(clientFTP.connected != true){ //. Check if file Exist to proceed.
        slog(' ERR ' , ':: FTP Connection not stablished');
        return;
      }
      if (filename) {
        var todo = null;
        switch(eventType){
          case 'rename':
            //Allways need to check if the file already exist, if not, delete from Server, else do the Rename Action or Create Action.
            slog('Renamed:', filename);
            todo = 'upload';
          break;
          case 'change':
            slog('Changed:', filename);
            todo = 'upload';
          break;
          default:
            slog(' ERR ' , ':: Unknown watch eventType: ' + eventType);
            return;
          break;
        }
        // Alway, the current File will be uploaded or deleted... this will trate the final action.
        if(todo == 'upload'){
          fs.stat(filepath, (err, stats)=>{
            //if(err) throw err;
            //console.log(stats);
            if(!stats){
              slog(' ERR ', ':: File not Found: ' + filename);
            }else{
              slog('Uploading:', filename);
              fs.readFile(filepath, (err, data) => {
                if (err) throw err;
                clientFTP.put(data, filename, function(err){
                  //if (err) throw err;
                  slog('Uploaded:', filename);
                  //clientFTP.end();
                });
              });
            }
          });
          
        }
        
      }else{
        slog(' ERR ', ':: Filename not provided');
      }
    });

    clientFTP.on('ready', function() {
      echo_header();
      // clientFTP.list(function(err, list) {
      //   if (err) throw err;
      //   //console.dir(list);
      //   for(i in list){
      //     console.log(list[i].type + ' | ' + list[i].name);
      //   }
      //   //clientFTP.end();
      // });
    });
    clientFTP.on('close', function(){
      slog(' SYS ', ':: Connection with the Server Closed');
      slog(' SYS ', ':: Trying to Reconnect');
      clientFTP.connect(cObj);
    });
    clientFTP.on('error', function(err){
      console.log(err);
    });
    //Connect to Remote FTP Server
    log('Trying to connect with Server');
    clientFTP.connect(cObj);




