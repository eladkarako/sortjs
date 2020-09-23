/* ╔═══════════════════════════════════╗
   ║ text-file sort and unique lines.  ║
   ╟───────────────────────────────────╢
   ║ input:  myfile.txt                ║
   ║ output: myfile_sorted.txt         ║
   ╟───────────────────────────────────╢
   ║ Exit-codes: native handled.       ║
   ╚═══════════════════════════════════╝
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ */
"use strict";


function natural_compare(a, b){
  var ax=[], bx=[];
  
  if("function" === typeof natural_compare.extraction_rule){  //sometimes comparing the whole line isn't useful.
    a = natural_compare.extraction_rule(a);
    b = natural_compare.extraction_rule(b);
  }
  
  a.replace(/(\d+)|(\D+)/g, function(_, $1, $2){ ax.push([$1 || Infinity, $2 || ""]); });
  b.replace(/(\d+)|(\D+)/g, function(_, $1, $2){ bx.push([$1 || Infinity, $2 || ""]); });

  while(ax.length > 0 && bx.length > 0){
    var an, bn, nn;
    
    an = ax.shift();
    bn = bx.shift();
    nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
    if(nn) return nn;
  }
  return ax.length - bx.length;
}


const FS                = require("fs")
     ,PATH              = require("path")
     ,resolve           = function(path){
                            path = path.replace(/\"/g,"");
                            path = path.replace(/\\+/g,"/");
                            path = PATH.resolve(path); 
                            path = path.replace(/\\+/g,"/"); 
                            path = path.replace(/\/\/+/g,"/"); 
                            return path;
                          }
     ,ARGS              = process.argv.filter(function(s){return false === /node\.exe/i.test(s) && false === /index\.js/i.test(s);}).map(function(s){return s.replace(/\"/gm,"");})
     ,FILE_IN           = resolve(ARGS[0])
     ,FILE_IN_PARTS     = PATH.parse(FILE_IN)
     ,EXTRACTION_RULES  = {                                                           // an extraction-rule is for using just a part of the line in the compare-process instead of all of the line. the end result will still have the original line, this is just for the compare-action.
                            "trim_first"                                        :  /^\s*([^\s]+)\s*$/         // trim whitespace from begining and end first.
                           ,"pref_file_mozilla"                                 :  /^[^\"]+\"([^\"]+)\".*$/   // a Mozila-firefox pref file where the comparable-element is the first expression that is wrapped with the '"' character.
                           ,"from_start_upto_1st_tab"                           :  /^([^\t]+)\t.*$/           // tab-saperated where the comparable-element is first from the start of the line, up until the first tab. used in modified Apache 'mime.types' file where modified to have single value for each mimetype.
                           ,"from_start_upto_1st_colon_punctuation"             :  /^[\s\,]*([^\:]+)\:.*$/    // ignore whitespace and comma prefix, consider for sorting just up until first-':'-character. good for one-layer-JSON-values with/without comma-prefix.
                           ,"ignore_file_extension_everything_after_first_dot"  :  /^([^\.]+)\.*.*$/          // 'file1.exe.7z' will be represented in the comparison-process as 'file1'
                           ,"ignore_protocol_prefix"                            :  /^[^\:]+\:(.+)$/           // 'http://www.google.com/search?q=aaa' will compare just the 'www.google.com/search?q=aaa' part, ignoring the prefix.
                           ,"cal_xml_by_dtstart"                                :  /^.*dtstart\=\"(\d+)\".*$/ // the start date-time (unix time) of an event in the SMS-BACKUP-PRO (android application) format.
                           ,"pref_prop_android"                                 :  /^\s*([^\=]+)\s*\=.*$/     // keep the first part of the sentence, just until the '=', ignoring the content of the rest of the sentence.
                           ,"tsv_second_field"                                  :  /^[^\t]+\t([^\t]+).*$/     // TSV second-field:      aaaa\tbbbb\tcccc\t...  -> bbbb
                           ,"url_upsidedown_domain_order"                       :  function(a){return a.split(".").reverse().join(".");}
                           ,"domain_only_ignore_protocol_path_port_upsidedown"  :  function(a){return a.replace(/^[^\:]+\:\/\/([^\/\:]+).*$/,"$1"); }
                           ,"plain_string_upsidedown"                           :  function(a){return a.split("").reverse().join(".");}
                          }
     ,EXTRACTION_RULE   = EXTRACTION_RULES[ ARGS[1] ]  ||  undefined
     ,FILE_OUT          = resolve(
                            FILE_IN_PARTS.dir  
                          + "/" 
                          + FILE_IN_PARTS.name 
                          + "_sorted_uniqued"
                          + (("undefined" === typeof EXTRACTION_RULE) ? "" : "__extraction_rule__" + ARGS[1])
                          + FILE_IN_PARTS.ext
                          )
     ;


var   tmp                = new Object(null)
     ,content            = FS.readFileSync(FILE_IN, {encoding:"utf8"})                //raw text-content
                            .replace(/[\r\n]+/gm, "\n").replace(/\n+/gm, "\n")       //unify newline character, single newline the most.
                            .split("\n").filter(function(s){return s.length > 1;})   //no empty lines. whitespace is considered a perfectly valid content. if you do wish to remove all-whitespace lines and empty lines pre-include this line before this one:   .replace(/^\s*/g, "").replace(/(\s*$|^\s*)/gm, "")
     ;


//-------------------------------------------------unique
content.forEach(function(s){
  var unique_identifier = ("function"  === typeof EXTRACTION_RULE) ? EXTRACTION_RULE(s)               :  //self-managed function returns string
                          ("object"    === typeof EXTRACTION_RULE) ? s.replace(EXTRACTION_RULE, "$1") :  //regular expression (no match? will fallback to full-string)
                          s                                                                              //on error(?) fallback to full string
                          ;
  tmp[unique_identifier] = s;
});
content = Object.values(tmp);
//---------------------------------------------------------


natural_compare.extraction_rule = ("function"  === typeof EXTRACTION_RULE) ? EXTRACTION_RULE                                        :  //self-managed function returns string
                                  ("object"    === typeof EXTRACTION_RULE) ? function(s){return s.replace(EXTRACTION_RULE, "$1");}  :  //a function that regex-replace (fallback to full-string on no match).
                                  function(s){return s;}                                                                               //on error(?) fallback to a function that returns full string
                                  ;


content = content.sort(natural_compare)
                 .join("\r\n")
                 ;


FS.writeFileSync(FILE_OUT, content, {flag:"w", encoding:"utf8"}); //overwrite

