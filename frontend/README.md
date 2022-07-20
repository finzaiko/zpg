Webix Jet Demo App
===================

### COPY SPLIT

function getStringBetween(str, start, end) {
    const result = str.match(new RegExp(start + "(.*)" + end));
    return result[1];   
}
const testString = '#@#@#@#@#@#@ arifin #@#@#@#@#@#END';
console.log(getStringBetween(testString, '#@#@#@#@#@#@ ', ' #@#@#@#@#@#END')); 
 
 https://stackoverflow.com/questions/14867835/get-substring-between-two-characters-using-javascript
