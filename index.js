function asyncGeneratorStep(e,t,n,o,r,a,i){try{var s=e[a](i),c=s.value}catch(e){return void n(e)}s.done?t(c):Promise.resolve(c).then(o,r)}function _asyncToGenerator(e){return function(){var t=this,n=arguments;return new Promise(function(o,r){var a=e.apply(t,n);function i(e){asyncGeneratorStep(a,o,r,i,s,"next",e)}function s(e){asyncGeneratorStep(a,o,r,i,s,"throw",e)}i(void 0)})}}function _extends(){return(_extends=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(e[o]=n[o])}return e}).apply(this,arguments)}var commonjsGlobal="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},WORKER_ENABLED=!!(commonjsGlobal===commonjsGlobal.window&&commonjsGlobal.URL&&commonjsGlobal.Blob&&commonjsGlobal.Worker);function InlineWorker(e,t){var n,o=this;if(t=t||{},WORKER_ENABLED)return n=e.toString().trim().match(/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/)[1],new commonjsGlobal.Worker(commonjsGlobal.URL.createObjectURL(new commonjsGlobal.Blob([n],{type:"text/javascript"})));this.self=t,this.self.postMessage=function(e){setTimeout(function(){o.onmessage({data:e})},0)},setTimeout(e.bind(t,t),0)}InlineWorker.prototype.postMessage=function(e){var t=this;setTimeout(function(){t.self.onmessage({data:e})},0)};var inlineWorker=InlineWorker,Recorder=function(){function e(e,t){var n=this;this.config=_extends({bufferLen:4096,numChannels:2,mimeType:"audio/wav",sampleBit:16},t),this.recording=!1,this.callbacks={getBuffer:[],exportWAV:[]},this.context=e.context,this.node=(this.context.createScriptProcessor||this.context.createJavaScriptNode).call(this.context,this.config.bufferLen,this.config.numChannels,this.config.numChannels),this.node.onaudioprocess=function(e){if(n.recording){for(var t=[],o=0;o<n.config.numChannels;o++)t.push(e.inputBuffer.getChannelData(o));n.worker.postMessage({command:"record",buffer:t})}},e.connect(this.node),this.node.connect(this.context.destination);this.worker=new inlineWorker(function(){var e,t,n,o,r=0,a=[];function i(){for(var e=0;e<o;e++)a[e]=[]}function s(e,t){for(var n=new Float32Array(t),o=0,r=0;r<e.length;r++)n.set(e[r],o),o+=e[r].length;return n}function c(e,t,n){for(var o=0;o<n.length;o++)e.setUint8(t+o,n.charCodeAt(o))}function f(t){var r=new ArrayBuffer(44+2*t.length),a=new DataView(r);return c(a,0,"RIFF"),a.setUint32(4,36+2*t.length,!0),c(a,8,"WAVE"),c(a,12,"fmt "),a.setUint32(16,16,!0),a.setUint16(20,1,!0),a.setUint16(22,o,!0),a.setUint32(24,e,!0),a.setUint32(28,e*o*n/8,!0),a.setUint16(32,o*n/8,!0),a.setUint16(34,n,!0),c(a,36,"data"),a.setUint32(40,2*t.length,!0),8===n?function(e,t,n){for(var o=t,r=0;r<n.length;r++,o++){var a=Math.max(-1,Math.min(1,n[r])),i=a<0?32768*a:32767*a;e.setInt8(o,parseInt(i/256+128,10),!0)}}(a,44,t):function(e,t,n){for(var o=t,r=0;r<n.length;r++,o+=2){var a=Math.max(-1,Math.min(1,n[r]));e.setInt16(o,a<0?32768*a:32767*a,!0)}}(a,44,t),a}function l(e){for(var n=[],i=0;i<o;i++)n.push(s(a[i],r));var c=f(function(e,t){for(var n=e.length/t,o=new Float32Array(n),r=0;r<n;r++)o[r]=e[r*t];return o}(2===o?function(e,t){for(var n=e.length+t.length,o=new Float32Array(n),r=0,a=0;r<n;)o[r++]=e[a],o[r++]=t[a],a++;return o}(n[0],n[1]):n[0],Math.max(Math.round(t),1))),l=new Blob([c],{type:e});this.postMessage({command:"exportWAV",data:l})}this.onmessage=function(c){switch(c.data.command){case"init":!function(r){if(e=r.sampleRate,o=r.numChannels,n=r.sampleBit,t=r.originalSampleRate/e,e<8e3||e>48e3)throw new Error("Invalid sample rate.");if(o<1||o>2)throw new Error("Invalid channel count.");if(8!==n&&16!==n)throw new Error("Invalid sample bit.");i()}(c.data.config);break;case"record":!function(e){for(var t=0;t<o;t++)a[t].push(e[t]);r+=e[0].length}(c.data.buffer);break;case"exportWAV":l(c.data.type);break;case"getBuffer":!function(){for(var e=[],t=0;t<o;t++)e.push(s(a[t],r));this.postMessage({command:"getBuffer",data:e})}();break;case"clear":r=0,a=[],i()}}},{}),this.worker.postMessage({command:"init",config:{sampleRate:this.config.sampleRate||this.context.sampleRate,originalSampleRate:this.context.sampleRate,numChannels:this.config.numChannels,sampleBit:this.config.sampleBit}}),this.worker.onmessage=function(e){var t=n.callbacks[e.data.command].pop();"function"==typeof t&&t(e.data.data)}}e.forceDownload=function(e,t){var n=(window.URL||window.webkitURL).createObjectURL(e),o=window.document.createElement("a");o.href=n,o.download=t||"output.wav",o.click()},e.createFromUserMedia=function(){var t=_asyncToGenerator(regeneratorRuntime.mark(function t(n){var o,r;return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,navigator.mediaDevices.getUserMedia({audio:{mandatory:{googEchoCancellation:"false",googAutoGainControl:"false",googNoiseSuppression:"false",googHighpassFilter:"false"},optional:[]},video:!1});case 2:return o=t.sent,r=new AudioContext,t.abrupt("return",new e(r.createMediaStreamSource(o,n)));case 5:case"end":return t.stop()}},t,this)}));return function(e){return t.apply(this,arguments)}}();var t=e.prototype;return t.record=function(){this.recording=!0},t.stop=function(){this.recording=!1},t.clear=function(){this.worker.postMessage({command:"clear"})},t.getBuffer=function(e){var t=e||this.config.callback;if(!t)throw new Error("Callback not set");this.callbacks.getBuffer.push(t),this.worker.postMessage({command:"getBuffer"})},t.exportWAV=function(e,t){var n=t||this.config.mimeType,o=e||this.config.callback;if(!o)throw new Error("Callback not set");this.callbacks.exportWAV.push(o),this.worker.postMessage({command:"exportWAV",type:n})},e}();export default Recorder;