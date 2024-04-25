
const YAML = require('yaml');

function yamlConvert(jsonObject) {
    const doc = new YAML.Document();
    doc.contents = jsonObject;

    console.log(doc.toString());
    return doc.toString();
}

module.exports = yamlConvert;