// app/routes.js

//Module dependencies

var express         = require('express');
var app             = express();
var qr              = require('qr-image');
var router          = express.Router();
var cfenv           = require('cfenv');

console.log('>> Watson --> QR Code Generator Service');

var appEnv = cfenv.getAppEnv();
//console.log(appEnv);
// QR - Generator 
router.get('/qr', function(req, res) {
    if (process.env.VCAP_SERVICES) {
    console.log("QR-Code generator pressed..............."+  JSON.stringify(process.env.VCAP_SERVICES) );
    var cred = {
        "ttsUsername": appEnv.services.text_to_speech[0].credentials.username,
        "ttsPassword": appEnv.services.text_to_speech[0].credentials.password,
        "sttUsername": appEnv.services.speech_to_text[0].credentials.username,
        "sttPassword": appEnv.services.speech_to_text[0].credentials.password,
        "appURI": appEnv.app.application_uris[0],
        "endpointDialog": "/talk",
        "endpointRR": "/talkRR"
    }
    var code = qr.image(JSON.stringify(cred), { type: 'svg' });
    //res.type('svg');
    res.setHeader('Content-type', 'image/svg');
    code.pipe(res);
    }
    else{
        console.log("QR-Code generator initated fro local use");
          var cred = {
        "ttsUsername"   : "6f835df3-0673-409d-85c5-558a83cc045c",
        "ttsPassword"   : "IwX9neDVKXne",
        "sttUsername"   : "43d9ef6b-f84c-4888-b4ef-d576e0143aa3",
        "sttPassword"   : "ZOeGXrQ0Kw9Y",
        "appURI"        : "",
        "endpointDialog": "/talk",
        "endpointRR"    : "/talkRR"
    }
    
    //var qr_svg = qr.image('I love QR!', { type: 'svg' });
    //qr_svg.pipe(require('fs').createWriteStream('i_love_qr.svg'));
    //var svg_string = qr.imageSync('I love QR!', { type: 'svg' });
        
        var code = qr.image(JSON.stringify(cred), { type: 'svg' });
        var svg_string = qr.imageSync(JSON.stringify(cred), { type: 'svg' });
        res.type('svg');
        //res.setHeader('Content-type', 'image/svg');
        code.pipe(res);
    }
});


module.exports =router;










