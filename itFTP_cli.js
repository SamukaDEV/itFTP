


      //DECLARATIONS 
      const colors = require('colors');
      const notifier = require('node-notifier');
      const path = require('path');
      const fs = require('fs');
      var Client = require('ftp');
      var dateTime = new Date();
      var cObj = require('./configs.json');
      var clientFTP = new Client();
      //var workSpace = '/Users/sam/Dropbox/Saulo Breim/geral/localweb/project/';


      //Clear the Console
      console.clear();

      function log(content){
        console.log(content);
      }

      function echo_header(){
        console.clear();
        notify('Connection Stablished', cObj.host);
        console.log('Connection Stablished to ' + cObj.host);
            log('_________________________________________');
            log('|                                        ');
            log('|  Host: ' + cObj.host                    );
            log('|  User: ' + cObj.user                    );
            log('|  Password: ********'                    );
            log('|  WorkSpace to Sync: ' + cObj.workspace  );
            log('|________________________________________');
            log('');
      }
      function formatLog(action, content){
        var parseDateZero = function(d){
            if(d <= 9){
              d = '0'+d;
            }
            return d;
        }
        var dt = new Date();
        var cdt = parseDateZero(dt.getHours()) + ':' + parseDateZero(dt.getMinutes()) + ':' + parseDateZero(dt.getSeconds()) + ' } ';
        while(action.length < 15){
          action+= '_';
        }
        return cdt + action + content;
      }
      function slog(action, content){
        console.log(formatLog(action, content).black);
      }
      function elog(action, content){
        console.log(formatLog(action, content).red);
      }
      function glog(action, content){
        console.log(formatLog(action, content).green);
      }

      function notify(title, content){
        notifier.notify({
          title: title,
          message: content,
          sound: true,
          wait: true,
          closeLabel: 'Close'
          //icon: path.join(__dirname, 'coulson.jpg'), // Absolute path (doesn't work on balloons)
        }, (err, response)=>{
          return true;
        });
        notifier.on('click', (notifierObject, options)=>{
          return true;
        });
      }


      try{
        //check the configs file

      }catch(e){
        log('\n"configs.json" File are missing...\n\n     Format: \n\n { \n   "host": "",\n   "user": "",\n   "password": ""\n } \n\n\n\n\n');
        process.exit();
      }


      fs.watch(cObj.workspace, { encoding: 'utf8', recursive: true}, (eventType, filename) => {
        var filepath = cObj.workspace + filename;
        if(clientFTP.connected != true){
          slog('ERROR:' , 'FTP Connection not stablished');
          return;
        }
        if (filename) {
          for(i in cObj.exceptSpecificFiles){ // Function added to ignore GitHub Actions in the Folder Project and Another thing of Exceptions
            var item = cObj.exceptSpecificFiles[i];
            if(filename.search(item)>=0){ // Check if the file is in exceptSpecificFiles
              //console.log('Ignored ' + filename);
              return;
            }
          }
          var todo = null;
          switch(eventType){
            case 'rename':
              //Need to check if the file already exist, if not, delete from Server, else do the Rename Action or Create Action.
              slog('Renamed:', filename);
              todo = 'upload';
            break;
            case 'change':
              slog('Changed:', filename);
              todo = 'upload';
            break;
            default:
              elog('ERROR:' , 'Unknown watch eventType: ' + eventType);
              return;
            break;
          }
          // Always, the current File will be uploaded or deleted... this will trate the final action.
          if(todo == 'upload'){
            fs.stat(filepath, (err, stats)=>{
              //if(err) throw err;
              if(!stats){
                elog('File not Found:',  filename);
              }else{
                slog('Uploading:', filename);
                fs.readFile(filepath, (err, data) => {
                  if (err) {
                    //throw err;
                    elog('File not Found:', filename);
                    notify('Internal Error', 'File not found to send');
                    return;
                  }
                  clientFTP.put(data, filename, function(err){
                    //if (err) throw err;
                    glog('Uploaded:', filename);
                    notify('File Uploaded', filename);
                    //clientFTP.end();
                  });
                });
              }
            });
            
          }
          
        }else{
          elog('ERROR:', 'Filename not provided');
        }
      });

      clientFTP.on('ready', function() {
        echo_header();
      });
      clientFTP.on('close', function(){
        elog('SYSTEM:', 'Connection with the Server Closed');
        notify('SYSTEM:', 'Connection with the Server Closed');
        slog('SYSTEM:', 'Trying to Reconnect');
        clientFTP.connect(cObj);
      });
      clientFTP.on('error', function(err){
        notify('Internal Error', 'Trying to reconnect');
        console.log(err);
      });
      //Connect to Remote FTP Server
      log('Trying to connect with Server');
      //Trate the Password
      if(typeof(cObj.password) == 'boolean' && cObj.password == true){
        //Ask the password with notify popup
        notifier.notify({
            title: 'Password Missing',
            message: 'Insert your password to proceed',
            icon: path.join(__dirname, '/images/icon_info.png'), // Absolute path (doesn't work on balloons)
            sound: true, // Only Notification Center or Windows Toasters
            wait: false, // Wait with callback, until user action is taken against notification
            reply: true,
            closeLabel: 'Cancel',
            //icon: false,
            id: 1
          },
          function(err, response, metadata) {
            // Response is response from notification
            console.log(response);
            switch(response){
              case 'activate':
                console.log('dismiss');
                return true;
              break;
              case 'replied':
                cObj.password = metadata.activationValue;
                clientFTP.connect(cObj);
              break;
            }
            //return true;
          }
        );
      }else{
        clientFTP.connect(cObj);
      }




