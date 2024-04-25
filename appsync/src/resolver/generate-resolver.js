const chalk = require('chalk');
const boxen = require('boxen');
const fs = require("fs");
const YAML = require('yaml');

const templateFolder = "./appsync/src/resolver/template/";
const templateHeaderFolder = "./appsync/src/resolver/template/Header/"
const targetFolder = "./appsync/target/"

const resolverPrintHeader = async () => {
    const headerData = await fs.readFileSync(templateHeaderFolder + 'resolverHeader.txt', 'utf-8')
    await fs.writeFileSync(targetFolder + 'resolver.yaml', headerData, "utf-8", (err, data) => {
        if (err) throw err;
        console.log("Print Header Success")
    })
}

const resolverPrintResources = async () => {
    const headerData = await fs.readFileSync(templateHeaderFolder + 'resolverHeader.txt', 'utf-8')
    await fs.writeFileSync(targetFolder + 'resolver.yaml', headerData, "utf-8", (err, data) => {
        if (err) throw err;
        console.log("Print Resources Success")
    })
}

const getResolverString = async (mapping, type ) => {
    //read File
    const mainJson = require("../lambda/Mapper/main.json");

    let jsonElementType = "queryItem"

    if (type === "Query") {
        jsonElementType = "queryItem"
    }

    if (type === "Mutation") {
        jsonElementType = "mutationItem"
    }

    const elementTemplate = await fs.readFileSync(templateFolder + "resolverElement.txt", "utf-8", (err, data) => { if (err) throw err; });
    const elementCacheTemplate = await fs.readFileSync(templateFolder + "resolverCacheElement.txt", "utf-8", (err, data) => { if (err) throw err; });
    
    //check missing description in main.json
    const missingDescElement = mapping.reduce((acc, mappingElement) => {
        if (!mainJson.map(jsonElement => jsonElement[jsonElementType]).includes(mappingElement.fieldName)) {
            acc.push(mappingElement.fieldName);
        }
        return acc;
    }, [])

    if (missingDescElement.length > 0) {
        console.log(missingDescElement);
        throw new Error("Missing The Description of main.json for the following query item: " + missingDescElement.toString())
    }
    const result = mapping.reduce((acc, mapElement) => {
        const jsonItem = mainJson.find(element => element[jsonElementType] === mapElement.fieldName);

        let elementData = elementTemplate;

        if (jsonItem && 
            jsonItem.cachingKeys && Array.isArray(jsonItem.cachingKeys) && 
            jsonItem.ttl && Number.isInteger(jsonItem.ttl) && jsonItem.ttl <= 3600) {

            elementData = elementCacheTemplate;
            // const keysStr = "[" + jsonItem.cachingKeys.map((key)=>{
            //     return "'" + key + "'"
            // }) + "]"
            elementData = elementData.replace('{__cachingKeys__}', "['$context.arguments']");
            elementData = elementData.replace('{__ttl__}', jsonItem.ttl);
        }

        //replace fields based on Graphql Introspect Json
        Object.keys(mapElement).forEach(mapKey => {
            elementData = elementData.replace(`{__${mapKey}__}`, mapElement[mapKey]);
        })

        elementData = elementData.replace("{__TypeName__}", type);

        //replace function field by main.json
        const yamlData = YAML.parse(elementData)
        
        if (jsonItem) {
            let functionArray = [...(jsonItem.functionArray || [])];
            if (jsonItem.path && jsonItem.method ){
                functionArray = [...functionArray ,...["LambdaMapperFunctionId"]];
            }
            const finalFunctionArray = functionArray.map(element => ({ "Ref": element }))
            yamlData[mapElement.resolverName].Properties.PipelineConfig.Functions = finalFunctionArray;
            elementData = YAML.stringify(yamlData);
        }
        return acc + elementData;
    }, "")

    return result
}

const getResolverParam = async (typeName) => {
    const data = await fs.readFileSync(targetFolder + "graphql.schema.json", "utf-8", (err, data) => { if (err) throw err; });
    const json = JSON.parse(data)

    const getResolverParam = json.__schema.types
        .find(type => type.name === typeName).fields
        .map(field => ({
            resolverName: `${typeName}${field.name}Resolver`,
            fieldName: field.name
        }));

    return getResolverParam
}

const resolverPrinting = async (mapping) => {
    //read File
    const mainJson = require("../lambda/Mapper/main.json");
    const elementTemplate = await fs.readFileSync(templateFolder + "resolverElement.txt", "utf-8", (err, data) => { if (err) throw err; });
    //check missing description in main.json
    const missingDescElement = mapping.reduce((acc, mappingElement) => {
        if (!mainJson.map(jsonElement => jsonElement.queryItem).includes(mappingElement.fieldName)) {
            acc.push(mappingElement.fieldName);
        }
        return acc;
    }, [])
    if (missingDescElement.length > 0) {
        throw new Error("Missing The Description of main.json for the following query item: " + missingDescElement.toString())
    }
    const result = mapping.reduce((acc, mapElement) => {
        //replace fields based on Graphql Introspect Json
        let elementData = elementTemplate;
        Object.keys(mapElement).forEach(mapKey => {
            elementData = elementData.replace(`{__${mapKey}__}`, mapElement[mapKey]);
        })

        //replace function field by main.json
        const yamlData = YAML.parse(elementData)
        const jsonItem = mainJson.find(element => element.queryItem === mapElement.fieldName);
        if (jsonItem) {
            let functionArray = [...(jsonItem.functionArray || [])];
            if (jsonItem.path && jsonItem.method ){
                functionArray = [...functionArray ,...["LambdaMapperFunctionId"]];
            }
            const finalFunctionArray = functionArray.map(element => ({ "Ref": element }))
            yamlData[mapElement.resolverName].Properties.PipelineConfig.Functions = finalFunctionArray;
            elementData = YAML.stringify(yamlData);
        }
        return acc + elementData;
    }, "")

    const finalResult = YAML.stringify({ Resources: YAML.parse(result) })
    fs.appendFileSync(targetFolder + 'resolver.yaml', finalResult, "utf-8", (err, data) => {
        if (err) throw err;
        console.log("Print success")
    })
}

const resolverMapping = async () => {
    const data = await fs.readFileSync(targetFolder + "graphql.schema.json", "utf-8", (err, data) => { if (err) throw err; });
    const json = JSON.parse(data)
    const getResolverParam = json.__schema.types
        .find(type => type.name === "Query").fields
        .map(field => ({
            resolverName: `Query${field.name}Resolver`,
            fieldName: field.name
        }));
    return getResolverParam

}

const logError = (message) => {
    const chalkMessage = chalk.red.bold(message);
    const boxenOptions = {
        padding: 1,
        margin: 1,
        borderStyle: "bold",
        borderColor: "red"
    };
    console.log(boxen( chalkMessage, boxenOptions ))
}

const generateResolver = async () => {
    try{
        const mutationResolverParam = await getResolverParam("Mutation")
        const queryResolverParam = await getResolverParam("Query")
        await resolverPrintHeader()
        const mutationResolver = await getResolverString(mutationResolverParam, "Mutation")
        const queryResolver = await getResolverString(queryResolverParam, "Query")
        const finalResult = YAML.stringify({ Resources:YAML.parse(queryResolver + mutationResolver) })

        fs.appendFileSync(targetFolder + 'resolver.yaml', finalResult, "utf-8", (err, data) => {
            if (err) throw err;
            console.log("Print success")
        })
    } catch(err) {
        logError(err)
        process.exit(1)
    }
}

generateResolver();