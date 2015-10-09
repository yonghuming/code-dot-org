var jigsaw_locale = {lc:{"en":function(n){return n===1?"one":"other"}},
c:function(d,k){if(!d)throw new Error("MessageFormat: Data required for '"+k+"'.")},
n:function(d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: '"+k+"' isn't a number.");return d[k]-(o||0)},
v:function(d,k){jigsaw_locale.c(d,k);return d[k]},
p:function(d,k,o,l,p){jigsaw_locale.c(d,k);return d[k] in p?p[d[k]]:(k=jigsaw_locale.lc[l](d[k]-o),k in p?p[k]:p.other)},
s:function(d,k,p){jigsaw_locale.c(d,k);return d[k] in p?p[d[k]]:p.other}};
(window.blockly = window.blockly || {}).jigsaw_locale = {
"continue":function(d){return "!!-Continue-!!"},
"nextLevel":function(d){return "!!-Congratulations! You have completed this puzzle.-!!"},
"no":function(d){return "!!-No-!!"},
"numBlocksNeeded":function(d){return "!!-This puzzle can be solved with %1 blocks.-!!"},
"reinfFeedbackMsg":function(d){return "!!-You can press the \"Try again\" button to go back to playing your game.-!!"},
"share":function(d){return "!!-Share-!!"},
"shareGame":function(d){return "!!-Share your game:-!!"},
"yes":function(d){return "!!-Yes-!!"}};