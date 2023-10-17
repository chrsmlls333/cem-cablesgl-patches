window.Whammy=function(){function t(t,a){const e=function(t){let a=t[0].width,e=t[0].height,n=t[0].duration;for(let i=1;i<t.length;i++){if(t[i].width!=a)throw"Frame "+(i+1)+" has a different width";if(t[i].height!=e)throw"Frame "+(i+1)+" has a different height";if(t[i].duration<0||t[i].duration>32767)throw"Frame "+(i+1)+" has a weird duration (must be between 0 and 32767)";n+=t[i].duration}return{duration:n,width:a,height:e}}(t),n=[{id:440786851,data:[{data:1,id:17030},{data:1,id:17143},{data:4,id:17138},{data:8,id:17139},{data:"webm",id:17026},{data:2,id:17031},{data:2,id:17029}]},{id:408125543,data:[{id:357149030,data:[{data:1e6,id:2807729},{data:"whammy",id:19840},{data:"whammy",id:22337},{data:(i=e.duration,[].slice.call(new Uint8Array(new Float64Array([i]).buffer),0).map((function(t){return String.fromCharCode(t)})).reverse().join("")),id:17545}]},{id:374648427,data:[{id:174,data:[{data:1,id:215},{data:1,id:29637},{data:0,id:156},{data:"und",id:2274716},{data:"V_VP8",id:134},{data:"VP8",id:2459272},{data:1,id:131},{id:224,data:[{data:e.width,id:176},{data:e.height,id:186}]}]}]},{id:475249515,data:[]}]}];var i;const o=n[1],s=o.data[2];let h=0,u=0;for(;h<t.length;){const a={id:187,data:[{data:Math.round(u),id:179},{id:183,data:[{data:1,id:247},{data:0,size:8,id:241}]}]};s.data.push(a);const e=[];let n=0;do{e.push(t[h]),n+=t[h].duration,h++}while(h<t.length&&n<3e4);var c=0;const i={id:524531317,data:[{data:Math.round(u),id:231}].concat(e.map((function(t){const a=d({discardable:0,frame:t.data.slice(t.data.indexOf("*")-3),invisible:0,keyframe:1,lacing:0,trackNum:1,timecode:Math.round(c)});return c+=t.duration,{data:a,id:163}})))};o.data.push(i),u+=n}let f=0;for(let t=0;t<o.data.length;t++){t>=3&&(s.data[t-3].data[1].data[1].data=f);const e=r([o.data[t]],a);f+=e.size||e.byteLength||e.length,2!=t&&(o.data[t]=e)}return r(n,a)}function a(t){const a=[];for(;t>0;)a.push(255&t),t>>=8;return new Uint8Array(a.reverse())}function e(t,a){const e=new Uint8Array(a);for(let n=a-1;n>=0;n--)e[n]=255&t,t>>=8;return e}function n(t){const a=new Uint8Array(t.length);for(let e=0;e<t.length;e++)a[e]=t.charCodeAt(e);return a}function i(t){const a=[];t=(t.length%8?new Array(9-t.length%8).join("0"):"")+t;for(let e=0;e<t.length;e+=8)a.push(parseInt(t.substr(e,8),2));return new Uint8Array(a)}function r(t,d){const s=[];for(let o=0;o<t.length;o++){if(!("id"in t[o])){s.push(t[o]);continue}let h=t[o].data;"object"==typeof h&&(h=r(h,d)),"number"==typeof h&&(h="size"in t[o]?e(h,t[o].size):i(h.toString(2))),"string"==typeof h&&(h=n(h)),h.length;const u=h.size||h.byteLength||h.length,c=Math.ceil(Math.ceil(Math.log(u)/Math.log(2))/8),f=u.toString(2),l=new Array(7*c+7+1-f.length).join("0")+f,m=new Array(c).join("0")+"1"+l;s.push(a(t[o].id)),s.push(i(m)),s.push(h)}if(d){const t=o(s);return new Uint8Array(t)}return new Blob(s,{type:"video/webm"})}function o(t,a){null==a&&(a=[]);for(let e=0;e<t.length;e++)"object"==typeof t[e]?o(t[e],a):a.push(t[e]);return a}function d(t){let a=0;if(t.keyframe&&(a|=128),t.invisible&&(a|=8),t.lacing&&(a|=t.lacing<<1),t.discardable&&(a|=1),t.trackNum>127)throw"TrackNumber > 127 not supported";return[128|t.trackNum,t.timecode>>8,255&t.timecode,a].map((function(t){return String.fromCharCode(t)})).join("")+t.frame}function s(t){const a=t.RIFF[0].WEBP[0],e=a.indexOf("*");for(var n=0,i=[];n<4;n++)i[n]=a.charCodeAt(e+3+n);let r,o,d,s,h;return h=i[1]<<8|i[0],r=16383&h,o=h>>14,h=i[3]<<8|i[2],d=16383&h,s=h>>14,{width:r,height:d,data:a,riff:t}}function h(t){let a=0;const e={};for(;a<t.length;){const n=t.substr(a,4);if(e[n]=e[n]||[],"RIFF"==n||"LIST"==n){const i=parseInt(t.substr(a+4,4).split("").map((function(t){const a=t.charCodeAt(0).toString(2);return new Array(8-a.length+1).join("0")+a})).join(""),2),r=t.substr(a+4+4,i);a+=8+i,e[n].push(h(r))}else"WEBP"==n?(e[n].push(t.substr(a+8)),a=t.length):(e[n].push(t.substr(a+4)),a=t.length)}return e}function u(t,a){this.frames=[],this.duration=1e3/t,this.quality=a||.8}return u.prototype.add=function(t,a){if(void 0!==a&&this.duration)throw"you can't pass a duration if the fps is set";if(void 0===a&&!this.duration)throw"if you don't have the fps set, you need to have durations here.";if(t.canvas&&(t=t.canvas),t.toDataURL)t=t.getContext("2d").getImageData(0,0,t.width,t.height);else if("string"!=typeof t)throw"frame must be a a HTMLCanvasElement, a CanvasRenderingContext2D or a DataURI formatted string";if("string"==typeof t&&!/^data:image\/webp;base64,/gi.test(t))throw"Input must be formatted properly as a base64 encoded DataURI of type image/webp";this.frames.push({image:t,duration:a||this.duration})},u.prototype.encodeFrames=function(t){if(this.frames[0].image instanceof ImageData){const e=this.frames,n=document.createElement("canvas"),i=n.getContext("2d");n.width=this.frames[0].image.width,n.height=this.frames[0].image.height;var a=function(r){console.log("encodeFrame",r);const o=e[r];i.putImageData(o.image,0,0),o.image=n.toDataURL("image/webp",this.quality),r<e.length-1?setTimeout((function(){a(r+1)}),1):t()}.bind(this);a(0)}else t()},u.prototype.compile=function(a,e){this.encodeFrames(function(){const n=new t(this.frames.map((function(t){const a=s(h(atob(t.image.slice(23))));return a.duration=t.duration,a})),a);e(n)}.bind(this))},{Video:u,fromImageArray:function(a,e,n){return t(a.map((function(t){const a=s(h(atob(t.slice(23))));return a.duration=1e3/e,a})),n)},toWebM:t}}();