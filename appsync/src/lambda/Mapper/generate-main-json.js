const chalk = require('chalk');
const boxen = require('boxen');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

const environmentFolder = "./appsync/src/lambda/Mapper/Environment/";
const mainJsonFolder = "./appsync/src/lambda/Mapper/"

async function getLinkageFile() {
    console.log(process.argv);
    const envFileName = argv.env ?? (() => {
        throw 'Missing Parameter [Environment] while running code'
    })()
    console.log(`${environmentFolder}${argv.env}`)
    return JSON.parse(fs.readFileSync(`${environmentFolder}${argv.env}.json`, 'utf8'))
}

const logError = (message) => {
    const chalkMessage = chalk.red.bold(message);
    const boxenOptions = {
        padding: 1,
        margin: 1,
        borderStyle: "bold",
        borderColor: "red"
    };
    console.log(boxen(chalkMessage, boxenOptions))
}

async function generateMainJson() {
    try {
        const linkageJson = await getLinkageFile();
        const mapJson = require('./map.json')
        const mainJson = mapJson.map((el) => {
            if (!el.service) {
                throw `Missing Parameter: Service for ${el.queryItem} in map.json`
            }
            if (!linkageJson[el.service]) {
                throw `Missing target host mapping in ${argv.env}.json for Service Name ${el.service}`
            }
            el.host = linkageJson[el.service]
            return el
        })
        console.log(mainJson);
        await fs.writeFileSync((mainJsonFolder + 'main.json'), JSON.stringify(mainJson), "utf-8", (err, data) => {
            if (err) throw err;
        })
    } catch (err) {
        logError(err)
        process.exit(1)
    }
}


generateMainJson()
